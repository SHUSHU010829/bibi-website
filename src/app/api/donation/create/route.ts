import { readSession } from "@/lib/donation/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  amountNtd?: unknown;
  platform?: unknown;
};

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json({ ok: false, error: "請先用 Discord 登入" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const amountNtd = Number(body.amountNtd);
  const platform = String(body.platform ?? "");

  if (!Number.isFinite(amountNtd) || amountNtd < 50) {
    return Response.json({ ok: false, error: "amountNtd 必須 ≥ 50" }, { status: 400 });
  }
  if (platform !== "ecpay" && platform !== "opay") {
    return Response.json({ ok: false, error: "platform 必須是 ecpay / opay" }, { status: 400 });
  }

  const guildId = process.env.PRIMARY_GUILD_ID;
  const botBase = process.env.BOT_API_BASE_URL;
  const secret = process.env.DONATION_GRANT_SECRET;

  // bot 端 session API 還沒上線 → 回 stub 讓 UI 流程可走完
  if (!botBase || !secret || !guildId) {
    const stubSessionId = `stub-${crypto.randomUUID()}`;
    return Response.json({
      ok: true,
      stub: true,
      sessionId: stubSessionId,
      merchantTradeNo: `DON${stubSessionId.replace(/-/g, "").slice(0, 17)}`,
      note: "BOT_API_BASE_URL / DONATION_GRANT_SECRET / PRIMARY_GUILD_ID 未設定；回傳 stub session 供 UI 測試。",
    });
  }

  // bot 端就緒後：建立真實 session（之後 W3 再把金流表單參數組起來）
  let botResp: Response;
  try {
    botResp = await fetch(`${botBase}/api/donation/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        userId: session.id,
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
    merchantTradeNo: string;
  };

  // TODO(W3): 用 merchantTradeNo + ECPAY_HASH_KEY/IV 組金流表單參數 + CheckMacValue
  return Response.json({
    ok: true,
    sessionId: botData.sessionId,
    merchantTradeNo: botData.merchantTradeNo,
    stub: true,
    note: "session 已建立；金流表單參數（CheckMacValue 等）待 W3 實作。",
  });
}
