// Dashboard 用的唯讀資料聚合。
//
// 共用 donation 的 MongoDB 連線（getDonationDb 已快取 client）。網站本身對 bot 的
// MongoDB 沒有寫入權限，所有欄位都按照 bibi-bot 端的 schema 平讀，不做反向相依。
//
// 找不到 doc 時回傳 0 值預設物件，而不是 null，方便上層渲染——「玩家還沒玩過」也
// 是合法狀態，不應該讓使用者看到「資料缺失」的錯誤畫面。連線失敗才會回 null，由
// 上層決定如何降級。

import { getDonationDb, getDonationRecordsCollection } from "@/lib/donation/mongo";

export interface CoinSummary {
  totalCoins: number;
  lifetimeCoins: number;
}

export interface LevelSummary {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progress: number;
  totalMessages: number;
  totalVoiceMinutes: number;
  totalCheckins: number;
  streak: number;
  longestStreak: number;
}

export interface MiningSummary {
  pickaxe: string;
  fishingRod: string;
  mineCountTotal: number;
  fishCountTotal: number;
  craftCountTotal: number;
  dungeonCount: number;
  workCountTotal: number;
  stamina: number | null;
  lifetimeOre: Record<string, number>;
  fishBag: Record<string, number>;
}

export interface DonationHistoryItem {
  tradeNo: string;
  amountNtd: number;
  tierId: string | null;
  platform: string;
  perks: string[] | null;
  grantedAt: Date;
}

// 與 bibi-bot src/utils/levelMath.js 同步——把 totalXp 換算成等級進度。
// 公式維持一致即可，重複實作比 IPC 簡單。
const xpForLevel = (level: number) => 5 * level * level + 50 * level + 100;

export function getLevelProgress(totalXp: number) {
  let level = 0;
  let xpAccum = 0;
  while (xpAccum + xpForLevel(level) <= totalXp) {
    xpAccum += xpForLevel(level);
    level += 1;
    if (level > 999) break;
  }
  const currentLevelXp = totalXp - xpAccum;
  const xpToNextLevel = xpForLevel(level);
  return {
    level,
    currentLevelXp,
    xpToNextLevel,
    progress: Math.min(1, currentLevelXp / xpToNextLevel),
  };
}

const emptyCoin = (): CoinSummary => ({ totalCoins: 0, lifetimeCoins: 0 });

const emptyLevel = (): LevelSummary => ({
  level: 0,
  totalXp: 0,
  currentLevelXp: 0,
  xpToNextLevel: xpForLevel(0),
  progress: 0,
  totalMessages: 0,
  totalVoiceMinutes: 0,
  totalCheckins: 0,
  streak: 0,
  longestStreak: 0,
});

const emptyMining = (): MiningSummary => ({
  pickaxe: "wood",
  fishingRod: "bamboo",
  mineCountTotal: 0,
  fishCountTotal: 0,
  craftCountTotal: 0,
  dungeonCount: 0,
  workCountTotal: 0,
  stamina: null,
  lifetimeOre: {},
  fishBag: {},
});

export async function getCoinSummary(
  userId: string,
  guildId: string,
): Promise<CoinSummary | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const doc = await db
    .collection("UserCoins")
    .findOne({ userId, guildId });
  if (!doc) return emptyCoin();
  return {
    totalCoins: Number(doc.totalCoins ?? 0),
    lifetimeCoins: Number(doc.lifetimeCoins ?? 0),
  };
}

export async function getLevelSummary(
  userId: string,
  guildId: string,
): Promise<LevelSummary | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const doc = await db
    .collection("UserLevels")
    .findOne({ userId, guildId });
  if (!doc) return emptyLevel();
  const totalXp = Number(doc.totalXp ?? 0);
  return {
    ...getLevelProgress(totalXp),
    totalXp,
    totalMessages: Number(doc.totalMessages ?? 0),
    totalVoiceMinutes: Number(doc.totalVoiceMinutes ?? 0),
    totalCheckins: Number(doc.totalCheckins ?? 0),
    streak: Number(doc.streak ?? 0),
    longestStreak: Number(doc.longestStreak ?? 0),
  };
}

export async function getMiningSummary(
  userId: string,
  guildId: string,
): Promise<MiningSummary | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const miningDoc = await db
    .collection("MiningProfiles")
    .findOne({ userId, guildId });
  const workDoc = await db
    .collection("WorkProfiles")
    .findOne({ userId, guildId });
  if (!miningDoc && !workDoc) return emptyMining();
  return {
    pickaxe: String(miningDoc?.pickaxe ?? "wood"),
    fishingRod: String(miningDoc?.fishing_rod ?? "bamboo"),
    mineCountTotal: Number(miningDoc?.mine_count_total ?? 0),
    fishCountTotal: Number(miningDoc?.fish_count_total ?? 0),
    craftCountTotal: Number(miningDoc?.craft_count_total ?? 0),
    dungeonCount: Number(miningDoc?.dungeon_count ?? 0),
    workCountTotal: Number(workDoc?.work_count_total ?? 0),
    stamina: miningDoc?.stamina == null ? null : Number(miningDoc.stamina),
    lifetimeOre: (miningDoc?.lifetime_ore as Record<string, number>) ?? {},
    fishBag: (miningDoc?.fish_bag as Record<string, number>) ?? {},
  };
}

export async function getDonationHistory(
  userId: string,
  guildId: string,
  limit = 10,
): Promise<DonationHistoryItem[]> {
  const col = await getDonationRecordsCollection();
  if (!col) return [];
  const docs = await col
    .find({ userId, guildId })
    .sort({ grantedAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => ({
    tradeNo: d.tradeNo,
    amountNtd: d.amountNtd,
    tierId: d.tierId,
    platform: d.platform,
    perks: d.perks,
    grantedAt: d.grantedAt,
  }));
}

export function getPrimaryGuildId(): string | null {
  const id = process.env.PRIMARY_GUILD_ID?.trim();
  return id && id.length > 0 ? id : null;
}

// ── CoinTransactions（金流紀錄）─────────────────────────────────────────────
//
// Schema 對齊 bibi-bot/src/features/economy/grantCoins.js：每筆收支寫一筆 doc，
// 欄位 { userId, guildId, amount(signed), source, meta, date("YYYY-MM-DD"
// in Asia/Taipei), createdAt(Date) }。query 與 bibi-bot/src/features/economy/
// coinHistory.js 同義——只要篩選/分類/標籤一致，網站才能跟 /我的金流紀錄 對齊。

export type CoinHistoryPeriod = "today" | "week" | "month" | "all";
export type CoinHistoryDirection = "all" | "in" | "out";

// 與 bot src/config/coinHistory.json 同步（任何來源／類別新增請在兩邊一起更新）
export const COIN_SOURCE_LABELS: Record<string, string> = {
  message: "💬 發言獎勵",
  voice: "🎧 語音獎勵",
  reaction: "👍 表情獎勵",
  bet: "🎰 賭場下注",
  payout: "🎰 賭場派彩",
  shop_buy: "🛒 商店消費",
  auction_bid: "🔨 拍賣競標",
  auction_payout: "🔨 拍賣收款",
  auction_refund: "🔨 拍賣退款",
  market_buy: "🏪 市集購買",
  market_escrow: "🏪 市集託管",
  market_bid: "🏪 市集競標",
  market_payout: "🏪 市集收款",
  market_refund: "🏪 市集退款",
  stock_buy: "📈 買股票",
  stock_sell: "📈 賣股票",
  stock_fee: "📈 股票手續費",
  stock_dividend: "📈 股息",
  transfer_in: "💸 收到轉帳",
  transfer_out: "💸 轉出",
  deposit_lock: "🏦 存款鎖定",
  deposit_release: "🏦 存款釋出",
  event_host_lock: "🎉 活動鎖款",
  event_prize: "🎉 活動獎金",
  event_refund: "🎉 活動退款",
  quest_daily: "📜 每日任務",
  quest_weekly: "📜 每週任務",
  quest_event: "📜 活動任務",
  encounter: "🎲 隨機事件",
  work: "⛏️ 打工",
  mining_sell: "⛏️ 賣礦",
  stone_appraisal: "💎 賭石鑑定",
  duel_stake: "⚔️ 對決下注",
  duel_payout: "⚔️ 對決派彩",
  duel_refund: "⚔️ 對決退款",
  invite_reward: "🎟️ 邀請獎勵",
  invite_welcome: "🎟️ 邀請見面禮",
  invite_clawback: "🎟️ 邀請回收",
  welfare: "🏛️ 福利金",
  wealth_tax: "🏛️ 財富稅",
  donation: "💖 抖內",
  admin: "🛠️ 系統調整",
};

export const COIN_CATEGORIES: { id: string; label: string; sources: string[] }[] =
  [
    { id: "all", label: "全部來源", sources: [] },
    { id: "earn", label: "📥 一般收入", sources: ["message", "voice", "reaction"] },
    { id: "casino", label: "🎰 賭場", sources: ["bet", "payout"] },
    { id: "shop", label: "🛒 商店", sources: ["shop_buy"] },
    {
      id: "auction",
      label: "🔨 拍賣行",
      sources: ["auction_bid", "auction_payout", "auction_refund"],
    },
    {
      id: "market",
      label: "🏪 市集",
      sources: [
        "market_buy",
        "market_escrow",
        "market_bid",
        "market_payout",
        "market_refund",
      ],
    },
    {
      id: "stock",
      label: "📈 股票",
      sources: ["stock_buy", "stock_sell", "stock_fee", "stock_dividend"],
    },
    {
      id: "transfer",
      label: "💸 轉帳/存款",
      sources: [
        "transfer_in",
        "transfer_out",
        "deposit_lock",
        "deposit_release",
      ],
    },
    {
      id: "event",
      label: "🎉 活動",
      sources: [
        "event_host_lock",
        "event_prize",
        "event_refund",
        "quest_daily",
        "quest_weekly",
        "quest_event",
        "encounter",
      ],
    },
    {
      id: "work",
      label: "⛏️ 工作/挖礦",
      sources: ["work", "mining_sell", "stone_appraisal"],
    },
    {
      id: "duel",
      label: "⚔️ 對決",
      sources: ["duel_stake", "duel_payout", "duel_refund"],
    },
    {
      id: "invite",
      label: "🎟️ 邀請",
      sources: ["invite_reward", "invite_welcome", "invite_clawback"],
    },
    {
      id: "system",
      label: "🏛️ 系統",
      sources: ["welfare", "wealth_tax", "donation", "admin"],
    },
  ];

export interface CoinHistoryItem {
  amount: number;
  source: string;
  meta: Record<string, unknown>;
  date: string;
  createdAt: Date;
}

export interface CoinHistoryPage {
  rows: CoinHistoryItem[];
  total: number;
  pageSize: number;
  page: number;
  inflow: number;
  outflow: number;
}

// 與 bot 端 query 同步：日期欄是 ISO date string（YYYY-MM-DD），時區固定
// Asia/Taipei；不能用 createdAt 換算，否則跨日邊界會跟 bot 對不上。
function getTaipeiNowParts(): { todayISO: string; weekStartISO: string; monthStartISO: string } {
  // 直接抓 Asia/Taipei 當下的 YYYY-MM-DD，避免依賴額外套件。
  const fmtDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayISO = fmtDate.format(new Date());
  const [y, m, d] = todayISO.split("-").map((s) => parseInt(s, 10));
  // 用 UTC date 來算「同一日的星期幾」——只用週幾資訊，不用實際時刻。
  // Luxon 的 startOf("week") = Monday；JS getDay() 週日為 0，週一為 1。
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const daysSinceMonday = (dow + 6) % 7;
  const mondayUTC = new Date(Date.UTC(y, m - 1, d - daysSinceMonday));
  const weekStartISO = mondayUTC.toISOString().slice(0, 10);
  const monthStartISO = `${y.toString().padStart(4, "0")}-${m
    .toString()
    .padStart(2, "0")}-01`;
  return { todayISO, weekStartISO, monthStartISO };
}

function buildHistoryMatch(opts: {
  userId: string;
  guildId: string;
  period: CoinHistoryPeriod;
  direction: CoinHistoryDirection;
  category: string;
}): Record<string, unknown> {
  const match: Record<string, unknown> = {
    userId: opts.userId,
    guildId: opts.guildId,
  };
  const parts = getTaipeiNowParts();
  if (opts.period === "today") match.date = parts.todayISO;
  else if (opts.period === "week") match.date = { $gte: parts.weekStartISO };
  else if (opts.period === "month") match.date = { $gte: parts.monthStartISO };
  // "all" → 無 date 條件

  const cat = COIN_CATEGORIES.find((c) => c.id === opts.category);
  if (cat && cat.sources.length > 0) match.source = { $in: cat.sources };

  if (opts.direction === "in") match.amount = { $gt: 0 };
  else if (opts.direction === "out") match.amount = { $lt: 0 };

  return match;
}

export const COIN_HISTORY_PAGE_SIZE = 10;
export const COIN_HISTORY_MAX_PAGE = 20;

export async function getCoinHistory(
  userId: string,
  guildId: string,
  opts: {
    period: CoinHistoryPeriod;
    direction: CoinHistoryDirection;
    category: string;
    page: number;
  },
): Promise<CoinHistoryPage | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const col = db.collection("CoinTransactions");
  const page = Math.max(0, Math.min(COIN_HISTORY_MAX_PAGE - 1, opts.page));
  const match = buildHistoryMatch({ userId, guildId, ...opts });

  const [docs, summary, total] = await Promise.all([
    col
      .find(match)
      .sort({ createdAt: -1 })
      .skip(page * COIN_HISTORY_PAGE_SIZE)
      .limit(COIN_HISTORY_PAGE_SIZE)
      .toArray(),
    col
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            inflow: {
              $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] },
            },
            outflow: {
              $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] },
            },
          },
        },
      ])
      .toArray(),
    col.countDocuments(match),
  ]);

  const s = summary[0] ?? { inflow: 0, outflow: 0 };
  return {
    rows: docs.map((d) => ({
      amount: Number(d.amount ?? 0),
      source: String(d.source ?? ""),
      meta: (d.meta as Record<string, unknown>) ?? {},
      date: String(d.date ?? ""),
      createdAt: d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt),
    })),
    total,
    pageSize: COIN_HISTORY_PAGE_SIZE,
    page,
    inflow: Number(s.inflow ?? 0),
    outflow: Number(s.outflow ?? 0),
  };
}
