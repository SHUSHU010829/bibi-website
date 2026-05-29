import {
  computeAioCheckMac,
  computeCheckMac,
  decryptDataToString,
  safeEqual,
} from "./ecpayCrypto";
import { extractCode } from "./code";

export type Platform = "ecpay" | "opay";

type PlatformConfig = {
  merchantId: string;
  hashKey: string;
  hashIV: string;
};

function getPlatformConfig(platform: Platform): PlatformConfig | null {
  if (platform === "ecpay") {
    const merchantId = process.env.ECPAY_MERCHANT_ID;
    const hashKey = process.env.ECPAY_HASH_KEY;
    const hashIV = process.env.ECPAY_HASH_IV;
    if (!merchantId || !hashKey || !hashIV) return null;
    return { merchantId, hashKey, hashIV };
  }
  const merchantId = process.env.OPAY_MERCHANT_ID;
  const hashKey = process.env.OPAY_HASH_KEY;
  const hashIV = process.env.OPAY_HASH_IV;
  if (!merchantId || !hashKey || !hashIV) return null;
  return { merchantId, hashKey, hashIV };
}

// 平台收到非 1|OK 會重送；以下兩個 helper 都回 200 但 body 不同
function ok(): Response {
  return new Response("1|OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
function err(): Response {
  return new Response("0|Error", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function handleBroadcasterWebhook(
  req: Request,
  platform: Platform,
): Promise<Response> {
  const cfg = getPlatformConfig(platform);
  if (!cfg) {
    console.error(`[${platform}-webhook] config missing`);
    return err();
  }

  // 先讀原始字串再 parse，這樣 CheckMacValue 驗證失敗時能完整傾印 raw body
  // 供離線重現平台的簽章演算法（OPay 格式與 ECPay 不同，需真實樣本定位）。
  const rawBody = await req.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch (e) {
    console.error(`[${platform}-webhook] body not JSON:`, (e as Error).message);
    return err();
  }

  const merchantID = String(body.MerchantID ?? "");
  const dataField = body.Data;
  const incomingMac = String(body.CheckMacValue ?? "");

  if (!merchantID || !dataField || !incomingMac) {
    console.error(`[${platform}-webhook] missing MerchantID/Data/CheckMacValue`);
    return err();
  }
  if (merchantID !== cfg.merchantId) {
    console.error(
      `[${platform}-webhook] MerchantID mismatch want=${cfg.merchantId} got=${merchantID}`,
    );
    return err();
  }

  // 1. 解 Data 為「明文 JSON 字串」— CheckMacValue 用這個字串算
  let plaintext: string;
  try {
    plaintext = decryptDataToString(String(dataField), cfg.hashKey, cfg.hashIV);
  } catch (e) {
    console.error(`[${platform}-webhook] decrypt failed:`, (e as Error).message);
    return err();
  }

  // 2. CheckMacValue 驗證
  //   - OPay 直播主收款「付款結果通知」：簽外層參數（含密文 Data + RpHeader），
  //     用全方位金流排序演算法（官方文件附錄 1）。
  //   - ECPay 直播主版：簽解密後明文（線上已驗證可動，維持原樣）。
  const expectedMac =
    platform === "opay"
      ? computeAioCheckMac(body, cfg.hashKey, cfg.hashIV)
      : computeCheckMac(plaintext, cfg.hashKey, cfg.hashIV);
  const allowInsecure = process.env.DONATION_WEBHOOK_ALLOW_INSECURE === "1";
  if (!safeEqual(incomingMac, expectedMac)) {
    if (allowInsecure) {
      console.warn(
        `[${platform}-webhook] CheckMacValue mismatch (bypassed) want=${expectedMac} got=${incomingMac}`,
      );
    } else {
      console.error(
        `[${platform}-webhook] CheckMacValue mismatch want=${expectedMac} got=${incomingMac} plaintext-prefix=${plaintext.slice(0, 80)}`,
      );
      // 樣本擷取：完整傾印 raw body（Data 為密文、不含 HashKey/IV，可安全記錄）
      // 與完整解密明文，供離線重現正確簽章輸入與欄位 schema。複製 RAW_SAMPLE
      // 標記之間的內容即為一筆可重現的完整樣本。
      console.error(
        `[${platform}-webhook] RAW_SAMPLE_BEGIN ${JSON.stringify({ rawBody, plaintext })} RAW_SAMPLE_END`,
      );
      return err();
    }
  }

  // 3. 業務檢查
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(plaintext) as Record<string, unknown>;
  } catch (e) {
    console.error(`[${platform}-webhook] plaintext JSON parse failed:`, (e as Error).message);
    return err();
  }

  if (Number(data.RtnCode) !== 1) {
    console.warn(
      `[${platform}-webhook] non-success RtnCode=${data.RtnCode} RtnMsg=${data.RtnMsg}`,
    );
    return ok(); // 終止重送
  }
  if (Number(data.SimulatePaid) === 1) {
    console.log(`[${platform}-webhook] simulated payment, no grant`);
    return ok();
  }

  const order = (data.OrderInfo ?? {}) as Record<string, unknown>;
  if (String(order.TradeStatus) !== "1") {
    console.warn(`[${platform}-webhook] TradeStatus=${order.TradeStatus}`);
    return ok();
  }

  // 4. 抽 code、組 grant payload
  //   OPay 的 PatronName/PatronNote 在 OrderInfo 裡（官方文件 p.9–10），
  //   ECPay 則放在最外層 → 先讀 OrderInfo，再 fallback 到外層，兩家都涵蓋。
  const patronName = String(order.PatronName ?? data.PatronName ?? "");
  const patronNote = String(order.PatronNote ?? data.PatronNote ?? "");
  const code = extractCode(patronNote);
  const tradeNo = String(order.TradeNo ?? "");
  const amountNtd = Number(order.TradeAmt ?? 0);

  if (!tradeNo || !Number.isFinite(amountNtd) || amountNtd <= 0) {
    console.error(
      `[${platform}-webhook] bad order: tradeNo=${tradeNo} amount=${amountNtd}`,
    );
    return err();
  }

  // 5. 呼叫 bot grant API（未設定時就先 log，回 1|OK 終止重送）
  const botBase = process.env.BOT_API_BASE_URL?.replace(/\/+$/, "");
  const secret = process.env.DONATION_GRANT_SECRET;
  if (!botBase || !secret) {
    console.warn(
      `[${platform}-webhook] bot not configured; would-grant code=${code} tradeNo=${tradeNo} amount=${amountNtd} patron="${patronName}"`,
    );
    return ok();
  }

  try {
    const r = await fetch(`${botBase}/api/donation/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        code,
        tradeNo,
        amountNtd,
        platform,
        patronName,
        patronNote,
      }),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error(
        `[${platform}-webhook] bot grant failed ${r.status}: ${text}`,
      );
      return err(); // 讓平台重送
    }
  } catch (e) {
    console.error(`[${platform}-webhook] bot grant error:`, (e as Error).message);
    return err();
  }

  return ok();
}
