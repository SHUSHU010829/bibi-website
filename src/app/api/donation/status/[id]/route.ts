import type { NextRequest } from "next/server";
import { tierForAmount } from "@/lib/donation/tiers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// 簡易 in-memory 紀錄 stub session 從第一次輪詢起算的秒數
const stubStartedAt = new Map<string, number>();

export async function GET(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const stub = new URL(req.url).searchParams.get("stub") === "1";

  // 只有 create 明確標 stub=1（bot 未上線時）才走 stub 模擬完成
  if (stub) {
    return Response.json(stubStatus(id));
  }

  // TODO(W5): 設定 MONGODB_URI_READONLY 後，這裡改成唯讀讀 donation_sessions.status
  // / donation_records.code 做反查，並回 amountNtd / tierId / perks
  // 目前 bot 已上線但 website 還沒接 DB → 持續回 pending，donor 看到「等待
  // 付款通知中」逾時畫面，bot 那邊發放已經完成。
  return Response.json({ status: "pending" });
}

function stubStatus(id: string) {
  let started = stubStartedAt.get(id);
  if (!started) {
    started = Date.now();
    stubStartedAt.set(id, started);
  }
  const elapsedSec = (Date.now() - started) / 1000;
  if (elapsedSec < 4) {
    return { status: "pending" as const };
  }
  const amountNtd = 600;
  const tier = tierForAmount(amountNtd);
  return {
    status: "completed" as const,
    tradeNo: `STUBTRADE${id.slice(0, 8)}`,
    amountNtd,
    tierId: tier?.id ?? "premium",
    perks: tier?.perks ?? [],
  };
}
