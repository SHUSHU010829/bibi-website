import type { NextRequest } from "next/server";
import {
  getStockQuotes,
  getStockSeries,
  getPrimaryGuildId,
  type StockPeriod,
} from "@/lib/dashboard/stocks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

const PERIODS: StockPeriod[] = ["1d", "1w", "1m"];

function parsePeriod(v: string | null): StockPeriod {
  return PERIODS.includes(v as StockPeriod) ? (v as StockPeriod) : "1d";
}

// 前端每 ~15 秒輪詢：回傳全部報價 + 選定 symbol 的走勢。連線 / 設定缺失時
// 回 { ok:false, status:"unconfigured" }，前端維持現有畫面不清空。
export async function GET(req: NextRequest) {
  const guildId = getPrimaryGuildId();
  if (!guildId) {
    return Response.json({ ok: false, status: "unconfigured" as const });
  }

  const sp = new URL(req.url).searchParams;
  const period = parsePeriod(sp.get("period"));

  const quotes = await getStockQuotes(guildId).catch(() => null);
  if (!quotes) {
    return Response.json({ ok: false, status: "unconfigured" as const });
  }

  const requested = sp.get("symbol");
  const symbol =
    requested && quotes.some((q) => q.symbol === requested)
      ? requested
      : quotes[0]?.symbol ?? null;

  const series = symbol ? await getStockSeries(guildId, symbol, period).catch(() => null) : null;

  return Response.json({
    ok: true as const,
    updatedAt: Date.now(),
    period,
    symbol,
    quotes,
    series,
  });
}
