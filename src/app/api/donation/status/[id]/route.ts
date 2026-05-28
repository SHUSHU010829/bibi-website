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

  if (stub || !process.env.MONGODB_URI_READONLY) {
    return Response.json(stubStatus(id));
  }

  // TODO(W2): 唯讀 MongoDB 讀 donation_sessions.status
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
