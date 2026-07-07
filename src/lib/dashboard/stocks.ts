import "server-only";

// 股票查看頁的唯讀資料聚合。
//
// 共用 donation 的 MongoDB 連線（getDonationDb 已快取 client），只平讀 bot 端的
// StockMarket / StockPrices / StockTransactions，不做任何寫入。
//
// bot 的股市是「每伺服器獨立」的，網站固定用 PRIMARY_GUILD_ID 當對外官方盤，
// 所有訪客看到同一份。連線 / 設定缺失時回 null，由上層降級成「尚未設定」畫面。

import { getDonationDb } from "@/lib/donation/mongo";
import { getPrimaryGuildId } from "@/lib/dashboard/profile";
import { STOCKS, STOCK_TYPE_LABELS } from "@/lib/dashboard/botDefs";

export type StockPeriod = "1h" | "1d" | "1w" | "1m";

const PERIOD_MS: Record<StockPeriod, number> = {
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
};

// 每個期間的分桶大小：1小時→每3分、1天→每30分、1週/1月→每天。
// （bot 每 1 分鐘 tick，桶內約 3 / 30 個 tick，K 棒實體才紮實。）
// K 線與量柱共用同一組桶，桶邊界一致 → 兩者在時間軸上自然對齊。
const BUCKET_MS: Record<StockPeriod, number> = {
  "1h": 3 * 60 * 1000,
  "1d": 30 * 60 * 1000,
  "1w": 24 * 60 * 60 * 1000,
  "1m": 24 * 60 * 60 * 1000,
};

const LINE_MAX_POINTS = 240;

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

function typeOf(symbol: string): string {
  return STOCKS[symbol]?.type ?? "";
}

function nameOf(symbol: string, fallback: string): string {
  return STOCKS[symbol]?.name ?? fallback ?? symbol;
}

// 報價清單：讀 StockMarket，漲跌以「當日開盤價 openPrice」為基準（比照 bot）。
export async function getStockQuotes(guildId: string): Promise<StockQuote[]> {
  const db = await getDonationDb();
  if (!db) return [];
  const docs = await db
    .collection("StockMarket")
    .find({ guildId, enabled: { $ne: false } })
    .toArray();

  const quotes: StockQuote[] = docs.map((d) => {
    const dd = d as Record<string, unknown>;
    const symbol = String(dd.symbol ?? "");
    const price = Number(dd.currentPrice ?? 0);
    const open = Number(dd.openPrice ?? price) || price;
    const change = price - open;
    const changePct = open > 0 ? (change / open) * 100 : 0;
    const type = typeOf(symbol);
    return {
      symbol,
      name: nameOf(symbol, String(dd.name ?? "")),
      type,
      typeLabel: STOCK_TYPE_LABELS[type] ?? "",
      price,
      open,
      change,
      changePct,
      floor: Number(dd.floor ?? 0),
      sentiment: String(dd.marketSentiment ?? "sideways"),
    };
  });

  // 依 config pool 的順序排（找不到的排後面），讓清單順序穩定。
  const order = Object.keys(STOCKS);
  quotes.sort((a, b) => {
    const ia = order.indexOf(a.symbol);
    const ib = order.indexOf(b.symbol);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
  return quotes;
}

function sampleLine(points: StockPricePoint[]): StockPricePoint[] {
  if (points.length <= LINE_MAX_POINTS) return points;
  const step = Math.ceil(points.length / LINE_MAX_POINTS);
  const out = points.filter((_, i) => i % step === 0);
  const last = points[points.length - 1];
  if (out[out.length - 1]?.t !== last.t) out.push(last);
  return out;
}

function buildCandles(points: StockPricePoint[], bucketMs: number): StockCandle[] {
  const byBucket = new Map<number, StockPricePoint[]>();
  for (const pt of points) {
    const key = Math.floor(pt.t / bucketMs) * bucketMs;
    const arr = byBucket.get(key);
    if (arr) arr.push(pt);
    else byBucket.set(key, [pt]);
  }
  const keys = [...byBucket.keys()].sort((a, b) => a - b);
  return keys.map((key) => {
    const arr = byBucket.get(key)!;
    const prices = arr.map((p) => p.p);
    return {
      t: key,
      o: prices[0],
      h: Math.max(...prices),
      l: Math.min(...prices),
      c: prices[prices.length - 1],
    };
  });
}

async function buildVolume(
  db: Awaited<ReturnType<typeof getDonationDb>>,
  guildId: string,
  symbol: string,
  since: number,
  bucketMs: number,
): Promise<StockVolumeBar[]> {
  if (!db) return [];
  const rows = await db
    .collection("StockTransactions")
    .find(
      {
        guildId,
        symbol,
        side: { $in: ["buy", "sell"] },
        timestamp: { $gte: new Date(since) },
      },
      { projection: { side: 1, shares: 1, timestamp: 1 } },
    )
    .toArray();

  const byBucket = new Map<number, StockVolumeBar>();
  for (const r of rows) {
    const rr = r as Record<string, unknown>;
    const ts = rr.timestamp instanceof Date ? rr.timestamp.getTime() : Number(rr.timestamp);
    if (!Number.isFinite(ts)) continue;
    const key = Math.floor(ts / bucketMs) * bucketMs;
    let bar = byBucket.get(key);
    if (!bar) {
      bar = { t: key, buy: 0, sell: 0 };
      byBucket.set(key, bar);
    }
    const shares = Number(rr.shares ?? 0);
    if (rr.side === "buy") bar.buy += shares;
    else bar.sell += shares;
  }
  return [...byBucket.values()].sort((a, b) => a.t - b.t);
}

export async function getStockSeries(
  guildId: string,
  symbol: string,
  period: StockPeriod,
): Promise<StockSeries | null> {
  const db = await getDonationDb();
  if (!db) return null;

  const market = await db.collection("StockMarket").findOne({ guildId, symbol });
  if (!market) return null;

  const now = Date.now();
  const bucketMs = BUCKET_MS[period];
  const since = now - PERIOD_MS[period];

  const raw = await db
    .collection("StockPrices")
    .find(
      { guildId, symbol, timestamp: { $gte: new Date(since) } },
      { projection: { price: 1, timestamp: 1 } },
    )
    .sort({ timestamp: 1 })
    .toArray();

  const points: StockPricePoint[] = raw
    .map((r) => {
      const rr = r as Record<string, unknown>;
      const ts = rr.timestamp instanceof Date ? rr.timestamp.getTime() : Number(rr.timestamp);
      return { t: ts, p: Number(rr.price ?? 0) };
    })
    .filter((pt) => Number.isFinite(pt.t) && pt.p > 0);

  const candles = buildCandles(points, bucketMs);
  const volume = await buildVolume(db, guildId, symbol, since, bucketMs);

  let stat: StockSeries["stat"] = null;
  if (points.length > 0) {
    const prices = points.map((p) => p.p);
    const open = prices[0];
    const last = prices[prices.length - 1];
    stat = {
      open,
      last,
      high: Math.max(...prices),
      low: Math.min(...prices),
      changePct: open > 0 ? ((last - open) / open) * 100 : 0,
    };
  }

  return {
    symbol,
    period,
    since,
    now,
    bucketMs,
    points: sampleLine(points),
    candles,
    volume,
    stat,
  };
}

export function stocksConfigured(): boolean {
  return Boolean(getPrimaryGuildId() && process.env.MONGODB_URI_READONLY);
}

export { getPrimaryGuildId };
