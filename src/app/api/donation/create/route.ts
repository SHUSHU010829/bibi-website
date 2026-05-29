import { readSession } from "@/lib/donation/session";
import { generateCode } from "@/lib/donation/code";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  amountNtd?: unknown;
  platform?: unknown;
};

const ECPAY_DONATE_URL_PREFIX = "https://payment.ecpay.com.tw/Broadcaster/Donate/";
const OPAY_DONATE_URL_PREFIX = "https://payment.opay.tw/Broadcaster/Donate/";

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json({ ok: false, error: "請先用 Discord 登入" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const amountNtd = Number(body.amountNtd);
  const platform = String(body.platform ?? "");

  if (!Number.isFinite(amountNtd) || amountNtd < 50) {
    return Response.json(
      { ok: false, error: "amountNtd 必須 ≥ 50（未滿 NT$50 不發放方案回饋）" },
      { status: 400 },
    );
  }
  if (platform !== "ecpay" && platform !== "opay") {
    return Response.json({ ok: false, error: "platform 必須是 ecpay / opay" }, { status: 400 });
  }

  const broadcasterId =
    platform === "ecpay"
      ? process.env.ECPAY_BROADCASTER_ID
      : process.env.OPAY_BROADCASTER_ID;
  if (!broadcasterId) {
    return Response.json(
      { ok: false, error: `${platform.toUpperCase()}_BROADCASTER_ID 未設定` },
      { status: 503 },
    );
  }

  // trim：env 值若夾帶前後空白（例如 PRIMARY_GUILD_ID 設定時誤含空格），會一路
  // 污染到 bot session 與發放，導致以 {userId, guildId} 為鍵的回饋落到孤兒桶。
  const guildId = process.env.PRIMARY_GUILD_ID?.trim();
  const botBase = process.env.BOT_API_BASE_URL?.replace(/\/+$/, "");
  const secret = process.env.DONATION_GRANT_SECRET;

  // bot 端 session API 還沒上線 → 本地生 code，回 stub 讓 UI 流程可走完
  if (!botBase || !secret || !guildId) {
    const stubSessionId = `stub-${crypto.randomUUID()}`;
    const code = generateCode();
    return Response.json({
      ok: true,
      stub: true,
      sessionId: stubSessionId,
      code,
      paymentUrl: buildPaymentUrl(platform, broadcasterId),
      note: "BOT_API_BASE_URL / DONATION_GRANT_SECRET / PRIMARY_GUILD_ID 未設定；回傳 stub session 供 UI 測試。",
    });
  }

  // bot 端就緒後：建立真實 session（bot 內部產生 code，避免兩邊撞 code）
  let botResp: Response;
  try {
    botResp = await fetch(`${botBase}/api/donation/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        userId: String(session.id).trim(),
        guildId,
        amountNtd,
        platform,
      }),
      cache: "no-store",
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: `bot 無法連線：${(e as Error).message}` },
      { status: 503 },
    );
  }

  if (!botResp.ok) {
    const text = await botResp.text().catch(() => "");
    return Response.json(
      { ok: false, error: `bot session API 失敗 ${botResp.status}: ${text}` },
      { status: 502 },
    );
  }

  const botData = (await botResp.json()) as {
    ok: boolean;
    sessionId: string;
    code: string;
  };

  return Response.json({
    ok: true,
    sessionId: botData.sessionId,
    code: botData.code,
    paymentUrl: buildPaymentUrl(platform, broadcasterId),
  });
}

function buildPaymentUrl(platform: "ecpay" | "opay", broadcasterId: string): string {
  const prefix =
    platform === "ecpay" ? ECPAY_DONATE_URL_PREFIX : OPAY_DONATE_URL_PREFIX;
  return prefix + broadcasterId;
}
