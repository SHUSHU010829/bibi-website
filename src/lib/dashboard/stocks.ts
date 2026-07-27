import "server-only";

// 股票查看頁的唯讀資料聚合。
//
// 資料來源：bot（部署在 Vultr）的 HTTP API `/api/v1/stocks/*`。網站部署在 Vercel、
// 連不到 bot 所在主機的內網 MongoDB，故不再直連 DB，一律透過 BOT_API_BASE_URL 平讀
// bot 已彙總好的報價 / 走勢（與排行榜 API 同一條路）。彙總邏輯在 bot 端
// src/httpServer/stocksApi.js。連線 / 設定缺失時回空值，由上層降級成「尚未設定」畫面。

import { getPrimaryGuildId } from "@/lib/dashboard/profile";
import { STOCKS, STOCK_TYPE_LABELS } from "@/lib/dashboard/botDefs";

export type StockPeriod = "1h" | "1d" | "1w" | "1m";

export interface StockQuote {
  symbol: string;
  name: string;
  type: string;
  typeLabel: string;
  price: number;
  open: number;
  change: number;
  changePct: number;
  floor: number;
  sentiment: string;
}

export interface StockPricePoint {
  t: number;
  p: number;
}

export interface StockCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface StockVolumeBar {
  t: number;
  buy: number;
  sell: number;
}

export interface StockSeries {
  symbol: string;
  period: StockPeriod;
  since: number;
  now: number;
  bucketMs: number;
  points: StockPricePoint[];
  candles: StockCandle[];
  volume: StockVolumeBar[];
  stat: {
    open: number;
    last: number;
    high: number;
    low: number;
    changePct: number;
  } | null;
}

function getBotBase(): string | null {
  return process.env.BOT_API_BASE_URL || null;
}

async function fetchBot<T>(
  path: string,
  guildId: string,
  query: Record<string, string> = {},
): Promise<T | null> {
  const botBase = getBotBase();
  if (!botBase) return null;
  const url = new URL(path, botBase);
  url.searchParams.set("guildId", guildId);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  try {
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

// bot 只回傳 type（tech/blue/meme）；typeLabel 的中文表留在網站（botDefs），
// 這裡讀回後補上，避免兩邊各維護一份標籤。
function typeLabelOf(type: string): string {
  return STOCK_TYPE_LABELS[type] ?? "";
}

// 報價清單：讀 bot /api/v1/stocks/quotes。漲跌以「當日開盤價」為基準（bot 端已算）。
export async function getStockQuotes(guildId: string): Promise<StockQuote[]> {
  const data = await fetchBot<{ ok: boolean; quotes: Omit<StockQuote, "typeLabel">[] }>(
    "/api/v1/stocks/quotes",
    guildId,
  );
  if (!data?.ok || !Array.isArray(data.quotes)) return [];
  return data.quotes.map((q) => ({
    ...q,
    name: q.name || STOCKS[q.symbol]?.name || q.symbol,
    typeLabel: typeLabelOf(q.type),
  }));
}

export async function getStockSeries(
  guildId: string,
  symbol: string,
  period: StockPeriod,
): Promise<StockSeries | null> {
  const data = await fetchBot<{ ok: boolean; series: StockSeries | null }>(
    "/api/v1/stocks/series",
    guildId,
    { symbol, period },
  );
  if (!data?.ok) return null;
  return data.series ?? null;
}

export function stocksConfigured(): boolean {
  return Boolean(getPrimaryGuildId() && getBotBase());
}

export { getPrimaryGuildId };
