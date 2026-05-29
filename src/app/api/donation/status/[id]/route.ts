import type { NextRequest } from "next/server";
import { tierForAmount } from "@/lib/donation/tiers";
import {
  getDonationSessionsCollection,
  getDonationRecordsCollection,
} from "@/lib/donation/mongo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

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

  // 試著用 mongo 唯讀查真實狀態；連不上 / 沒設環境變數 → 回 pending（不誤導）
  const sessions = await getDonationSessionsCollection();
  if (!sessions) {
    return Response.json({ status: "pending" });
  }

  const session = await sessions.findOne({ sessionId: id }).catch(() => null);
  if (!session) {
    // session 不存在（可能 URL 錯、TTL 已清），donor 體感跟 pending 一樣即可
    return Response.json({ status: "pending" });
  }

  if (session.status === "expired") {
    return Response.json({ status: "expired" });
  }
  if (session.status !== "completed") {
    return Response.json({ status: "pending" });
  }

  // status === "completed" → 反查 record 拿 perks 清單
  if (!session.tradeNo) {
    // race window：session 翻 completed 但 tradeNo 還沒寫進去
    return Response.json({ status: "pending" });
  }

  const records = await getDonationRecordsCollection();
  const record = records
    ? await records.findOne({ tradeNo: session.tradeNo }).catch(() => null)
    : null;

  return Response.json({
    status: "completed" as const,
    tradeNo: session.tradeNo,
    amountNtd: record?.amountNtd ?? session.amountNtd,
    tierId: record?.tierId ?? null,
    perks: record?.perks ?? [],
  });
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
