import { computeCheckMac, decryptData, safeEqual } from "./ecpayCrypto";
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

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
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

  // 1. CheckMacValue 驗證
  const expectedMac = computeCheckMac(body, cfg.hashKey, cfg.hashIV);
  const allowInsecure = process.env.DONATION_WEBHOOK_ALLOW_INSECURE === "1";
  if (!safeEqual(incomingMac, expectedMac)) {
    if (allowInsecure) {
      console.warn(
        `[${platform}-webhook] CheckMacValue mismatch (bypassed by DONATION_WEBHOOK_ALLOW_INSECURE) want=${expectedMac} got=${incomingMac}`,
      );
    } else {
      console.error(
        `[${platform}-webhook] CheckMacValue mismatch want=${expectedMac} got=${incomingMac}`,
      );
      return err();
    }
  }

  // 2. 解 Data
  let data: Record<string, unknown>;
  try {
    data = decryptData(String(dataField), cfg.hashKey, cfg.hashIV);
  } catch (e) {
    console.error(`[${platform}-webhook] decrypt failed:`, (e as Error).message);
    return err();
  }

  // 3. 業務檢查
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
  const patronName = String(data.PatronName ?? "");
  const patronNote = String(data.PatronNote ?? "");
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
