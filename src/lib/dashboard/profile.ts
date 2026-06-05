// Dashboard 用的唯讀資料聚合。
//
// 共用 donation 的 MongoDB 連線（getDonationDb 已快取 client）。網站本身對 bot 的
// MongoDB 沒有寫入權限，所有欄位都按照 bibi-bot 端的 schema 平讀，不做反向相依。
//
// 找不到 doc 時回傳 0 值預設物件，而不是 null，方便上層渲染——「玩家還沒玩過」也
// 是合法狀態，不應該讓使用者看到「資料缺失」的錯誤畫面。連線失敗才會回 null，由
// 上層決定如何降級。

import { getDonationDb, getDonationRecordsCollection } from "@/lib/donation/mongo";
import {
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  BADGES,
  type BadgeDef,
} from "./botDefs";

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

// ── 加成 / 背包 / 裝備 / 任務 / 徽章 ──────────────────────────────────────

export interface ActiveBuff {
  type: string; // xp_boost / coin_boost
  multiplier: number;
  expiresAt: Date;
  source: string | null;
}

export interface BackpackSummary {
  /** MiningProfiles.backpack：道具 id → 數量 */
  items: Record<string, number>;
  /** MiningProfiles.lifetime_ore（累計挖到） */
  lifetimeOre: Record<string, number>;
  /** 礦袋現有 = lifetime_ore - 已賣？bot 端把目前持有放在 backpack。這裡讀 backpack。 */
  oreBag: Record<string, number>;
  fishBag: Record<string, number>;
  backpackSlots: number;
  legendaryFragments: number;
}

export async function getActiveBuffs(
  userId: string,
  guildId: string,
): Promise<ActiveBuff[] | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const doc = await db
    .collection("UserCoins")
    .findOne({ userId, guildId }, { projection: { activeBuffs: 1 } });
  if (!doc) return [];
  const buffs = (doc.activeBuffs as unknown[] | undefined) ?? [];
  const now = Date.now();
  return buffs
    .map((b) => b as Record<string, unknown>)
    .filter((b) => {
      const expIso = b.expiresAt;
      const exp = expIso instanceof Date ? expIso.getTime() : new Date(String(expIso ?? 0)).getTime();
      return exp > now;
    })
    .map<ActiveBuff>((b) => ({
      type: String(b.type ?? ""),
      multiplier: Number(b.multiplier ?? 1),
      expiresAt:
        b.expiresAt instanceof Date
          ? b.expiresAt
          : new Date(String(b.expiresAt ?? Date.now())),
      source: b.source ? String(b.source) : null,
    }));
}

export async function getBackpack(
  userId: string,
  guildId: string,
): Promise<BackpackSummary | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const doc = await db
    .collection("MiningProfiles")
    .findOne({ userId, guildId });
  if (!doc) {
    return {
      items: {},
      lifetimeOre: {},
      oreBag: {},
      fishBag: {},
      backpackSlots: 100,
      legendaryFragments: 0,
    };
  }
  return {
    items: ((doc as Record<string, unknown>).items as Record<string, number>) ?? {},
    lifetimeOre:
      ((doc as Record<string, unknown>).lifetime_ore as Record<string, number>) ?? {},
    oreBag:
      ((doc as Record<string, unknown>).backpack as Record<string, number>) ?? {},
    fishBag:
      ((doc as Record<string, unknown>).fish_bag as Record<string, number>) ?? {},
    backpackSlots:
      100 +
      Number((doc as Record<string, unknown>).backpack_bonus_slots ?? 0),
    legendaryFragments: Number((doc as Record<string, unknown>).legendary_fragments ?? 0),
  };
}

export interface EquipmentSummary {
  pickaxe: string;
  pickaxeDurability: number | null;
  fishingRod: string;
  fishingRodDurability: number | null;
  weapon: string;
  weaponDurability: number | null;
  stamina: number | null;
}

export async function getEquipment(
  userId: string,
  guildId: string,
): Promise<EquipmentSummary | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const doc = await db
    .collection("MiningProfiles")
    .findOne({ userId, guildId });
  if (!doc) {
    return {
      pickaxe: "wood",
      pickaxeDurability: null,
      fishingRod: "bamboo",
      fishingRodDurability: null,
      weapon: "fist",
      weaponDurability: null,
      stamina: null,
    };
  }
  const d = doc as Record<string, unknown>;
  return {
    pickaxe: String(d.pickaxe ?? "wood"),
    pickaxeDurability:
      d.pickaxe_durability != null ? Number(d.pickaxe_durability) : null,
    fishingRod: String(d.fishing_rod ?? "bamboo"),
    fishingRodDurability:
      d.fishing_rod_durability != null ? Number(d.fishing_rod_durability) : null,
    weapon: String(d.weapon ?? "fist"),
    weaponDurability: d.weapon_durability != null ? Number(d.weapon_durability) : null,
    stamina: d.stamina != null ? Number(d.stamina) : null,
  };
}

// ── 任務 ──────────────────────────────────────────────────────────────────

export interface QuestStateRow {
  questId: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  state: "pending" | "in_progress" | "ready" | "claimed";
}

export interface QuestStatus {
  daily: QuestStateRow[];
  weekly: QuestStateRow[];
}

function periodKeyForToday(): string {
  return getTaipeiNowParts().todayISO;
}

function periodKeyForWeek(): string {
  // ISO week kkkk-Www；不引入 luxon，這裡用本地計算
  const todayISO = getTaipeiNowParts().todayISO;
  const [y, m, d] = todayISO.split("-").map((s) => parseInt(s, 10));
  // 用 ISO week (週一為一週開始)
  const date = new Date(Date.UTC(y, m - 1, d));
  // shift to nearest Thursday: current date + 4 - current day number
  // ISO weekday: Mon=1 ... Sun=7
  const dayNum = (date.getUTCDay() + 6) % 7; // 0..6 with Mon=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // Thursday of this week
  const yearOfWeek = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(yearOfWeek, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNumber =
    1 +
    Math.round(
      (date.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
  return `${yearOfWeek}-W${String(weekNumber).padStart(2, "0")}`;
}

export async function getQuestStatus(
  userId: string,
  guildId: string,
): Promise<QuestStatus | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const col = db.collection("QuestProgress");
  const dailyPeriod = periodKeyForToday();
  const weeklyPeriod = periodKeyForWeek();

  const ids = [
    ...DAILY_QUESTS.map((q) => ({ questId: q.id, period: dailyPeriod })),
    ...WEEKLY_QUESTS.map((q) => ({ questId: q.id, period: weeklyPeriod })),
  ];
  const docs = await col
    .find({
      userId,
      guildId,
      $or: ids,
    })
    .toArray();
  const byKey = new Map<string, Record<string, unknown>>();
  for (const d of docs) {
    byKey.set(`${(d as Record<string, unknown>).questId}|${(d as Record<string, unknown>).period}`, d as Record<string, unknown>);
  }

  const enrich = (def: typeof DAILY_QUESTS[number], period: string): QuestStateRow => {
    const doc = byKey.get(`${def.id}|${period}`);
    const progress = Number(doc?.progress ?? 0);
    const target = def.target;
    const completed = Boolean(doc?.completed) || progress >= target;
    const claimed = Boolean(doc?.claimed);
    let state: QuestStateRow["state"] = "pending";
    if (claimed) state = "claimed";
    else if (completed) state = "ready";
    else if (progress > 0) state = "in_progress";
    return {
      questId: def.id,
      progress: Math.min(progress, target),
      target,
      completed,
      claimed,
      state,
    };
  };

  return {
    daily: DAILY_QUESTS.map((q) => enrich(q, dailyPeriod)),
    weekly: WEEKLY_QUESTS.map((q) => enrich(q, weeklyPeriod)),
  };
}

// ── 徽章（與 /稱號 用同一份定義）─────────────────────────────────────────────

export interface BadgeProgressRow {
  def: BadgeDef;
  current: number;
  unlocked: boolean;
  progress: number; // 0..1
}

export function evaluateBadges(level: LevelSummary): BadgeProgressRow[] {
  const fieldValue = (field: BadgeDef["field"]): number => {
    switch (field) {
      case "level":
        return level.level;
      case "longestStreak":
        return level.longestStreak;
      case "totalMessages":
        return level.totalMessages;
      case "totalVoiceMinutes":
        return level.totalVoiceMinutes;
      case "totalReactionsReceived":
        // dashboard 目前還沒在 LevelSummary 暴露這個欄位 → 視為 0
        return 0;
    }
  };
  return BADGES.map((def) => {
    const current = fieldValue(def.field);
    const unlocked = current >= def.threshold;
    return {
      def,
      current,
      unlocked,
      progress: Math.min(1, def.threshold > 0 ? current / def.threshold : 0),
    };
  });
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
      id: "market",
      label: "🏪 市集",
      sources: [
        "market_buy",
        "market_escrow",
        "market_bid",
        "market_payout",
        "market_refund",
        "auction_bid",
        "auction_payout",
        "auction_refund",
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
function getTaipeiNowParts(): {
  todayISO: string;
  weekStartISO: string;
  monthStartISO: string;
  yearStartISO: string;
} {
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
  const yearStartISO = `${y.toString().padStart(4, "0")}-01-01`;
  return { todayISO, weekStartISO, monthStartISO, yearStartISO };
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

// ── 稅務紀錄（複用 CoinTransactions，source = wealth_tax）──────────────────────

export type TaxHistoryPeriod = "month" | "year" | "all";

export interface TaxHistoryRow {
  amount: number;
  before: number | null;
  effectiveRate: number | null;
  createdAt: Date;
  date: string;
}

export interface TaxHistorySummary {
  rows: TaxHistoryRow[];
  totalTaxed: number;
  count: number;
  avgRate: number | null;
}

export async function getTaxHistory(
  userId: string,
  guildId: string,
  period: TaxHistoryPeriod,
): Promise<TaxHistorySummary | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const col = db.collection("CoinTransactions");
  const match: Record<string, unknown> = {
    userId,
    guildId,
    source: "wealth_tax",
  };
  const parts = getTaipeiNowParts();
  if (period === "month") match.date = { $gte: parts.monthStartISO };
  else if (period === "year") match.date = { $gte: parts.yearStartISO };

  const docs = await col.find(match).sort({ createdAt: -1 }).limit(60).toArray();
  let totalTaxed = 0;
  let rateSum = 0;
  let rateCount = 0;
  for (const d of docs) {
    totalTaxed += Math.abs(Number(d.amount ?? 0));
    const meta = (d.meta as Record<string, unknown>) ?? {};
    const rate = meta.effectiveRate;
    if (typeof rate === "number" && Number.isFinite(rate)) {
      rateSum += rate;
      rateCount += 1;
    }
  }
  return {
    rows: docs.map((d) => {
      const meta = (d.meta as Record<string, unknown>) ?? {};
      const before = typeof meta.before === "number" ? meta.before : null;
      const rate = typeof meta.effectiveRate === "number" ? meta.effectiveRate : null;
      return {
        amount: Number(d.amount ?? 0),
        before,
        effectiveRate: rate,
        createdAt:
          d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt),
        date: String(d.date ?? ""),
      };
    }),
    totalTaxed,
    count: docs.length,
    avgRate: rateCount > 0 ? rateSum / rateCount : null,
  };
}

// ── 邀請統計（InviteRecords）─────────────────────────────────────────────────

export interface InviteStats {
  active: number;
  left: number;
  clawedBack: number;
  totalReward: number;
  totalClawback: number;
}

export async function getInviteStats(
  userId: string,
  guildId: string,
): Promise<InviteStats | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const col = db.collection("InviteRecords");
  const agg = await col
    .aggregate([
      { $match: { guildId, inviterId: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalReward: { $sum: { $ifNull: ["$rewardGranted", 0] } },
          totalClawback: { $sum: { $ifNull: ["$clawedBackAmount", 0] } },
        },
      },
    ])
    .toArray();

  const out: InviteStats = {
    active: 0,
    left: 0,
    clawedBack: 0,
    totalReward: 0,
    totalClawback: 0,
  };
  for (const r of agg) {
    out.totalReward += Number(r.totalReward ?? 0);
    out.totalClawback += Number(r.totalClawback ?? 0);
    const count = Number(r.count ?? 0);
    if (r._id === "active") out.active = count;
    else if (r._id === "left") out.left = count;
    else if (r._id === "clawed_back") out.clawedBack = count;
  }
  return out;
}

// ── 決鬥紀錄（DuelGames）────────────────────────────────────────────────────

export interface DuelHistoryRow {
  isWin: boolean;
  opponentId: string;
  bet: number;
  pot: number;
  net: number; // 從 viewer 角度，正負金幣
  completedAt: Date;
}

export interface DuelHistorySummary {
  rows: DuelHistoryRow[];
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export async function getDuelHistory(
  userId: string,
  guildId: string,
  limit = 10,
): Promise<DuelHistorySummary | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const col = db.collection("DuelGames");
  const filter = {
    guild_id: guildId,
    status: "completed",
    $or: [{ challenger_id: userId }, { opponent_id: userId }],
  };
  const [docs, wins, total] = await Promise.all([
    col.find(filter).sort({ completed_at: -1 }).limit(limit).toArray(),
    col.countDocuments({ guild_id: guildId, status: "completed", winner_id: userId }),
    col.countDocuments(filter),
  ]);

  return {
    rows: docs.map((d) => {
      const isChallenger = d.challenger_id === userId;
      const opponentId = isChallenger ? d.opponent_id : d.challenger_id;
      const isWin = d.winner_id === userId;
      const bet = Number(d.bet ?? 0);
      const pot = Number(d.pot ?? bet * 2);
      const completed =
        d.completed_at instanceof Date
          ? d.completed_at
          : new Date(d.completed_at ?? d.updated_at ?? Date.now());
      return {
        isWin,
        opponentId: String(opponentId ?? ""),
        bet,
        pot,
        net: isWin ? pot - bet : -bet,
        completedAt: completed,
      };
    }),
    wins,
    losses: total - wins,
    total,
    winRate: total > 0 ? wins / total : 0,
  };
}

// ── 排行榜（精簡版：等級／金幣／發言／語音／挖礦次數）─────────────────────────
//
// 與 bot src/features/leaderboard/ 同義，但限縮為直接 sort + count 就能算出的類
// 別；mining_value 之類需要拉 orePrices、賭場輸贏要排程化 aggregate 的暫不接，
// 等定義同步完再補。

export type LeaderboardKey =
  | "level"
  | "coin"
  | "messages"
  | "voice"
  | "mining";

export type LeaderboardPeriod = "today" | "week" | "month" | "all";

export interface LeaderboardCategoryDef {
  key: LeaderboardKey;
  label: string;
  emoji: string;
  unit: string;
  periods: LeaderboardPeriod[];
  defaultPeriod: LeaderboardPeriod;
}

export const LEADERBOARD_CATEGORIES: LeaderboardCategoryDef[] = [
  {
    key: "level",
    label: "等級",
    emoji: "🏆",
    unit: "XP",
    periods: ["all"],
    defaultPeriod: "all",
  },
  {
    key: "coin",
    label: "金幣",
    emoji: "🪙",
    unit: "幣",
    periods: ["all"],
    defaultPeriod: "all",
  },
  {
    key: "messages",
    label: "訊息",
    emoji: "💬",
    unit: "則",
    periods: ["all"],
    defaultPeriod: "all",
  },
  {
    key: "voice",
    label: "語音時長",
    emoji: "🎤",
    unit: "分",
    periods: ["all"],
    defaultPeriod: "all",
  },
  {
    key: "mining",
    label: "挖礦累計",
    emoji: "⛏️",
    unit: "次",
    periods: ["all"],
    defaultPeriod: "all",
  },
];

export interface LeaderboardRow {
  userId: string;
  value: number;
  // 顯示用附加資訊（如等級榜的 Lv.N）
  sub?: string;
}

export interface LeaderboardResult {
  category: LeaderboardKey;
  period: LeaderboardPeriod;
  rows: LeaderboardRow[];
  total: number;
  myRank: number | null;
  myValue: number | null;
}

export async function getLeaderboard(
  guildId: string,
  category: LeaderboardKey,
  period: LeaderboardPeriod,
  viewerId: string | null,
  limit = 10,
): Promise<LeaderboardResult | null> {
  const db = await getDonationDb();
  if (!db) return null;

  // 各類別映射：collection / field / 子顯示
  const map: Record<
    LeaderboardKey,
    {
      collection: string;
      sortField: string;
      subRender?: (doc: Record<string, unknown>) => string | undefined;
    }
  > = {
    level: {
      collection: "UserLevels",
      sortField: "totalXp",
      subRender: (doc) => {
        const totalXp = Number(doc.totalXp ?? 0);
        const { level } = getLevelProgress(totalXp);
        return `Lv.${level}`;
      },
    },
    coin: {
      collection: "UserCoins",
      sortField: "totalCoins",
    },
    messages: {
      collection: "UserLevels",
      sortField: "totalMessages",
    },
    voice: {
      collection: "UserLevels",
      sortField: "totalVoiceMinutes",
    },
    mining: {
      collection: "MiningProfiles",
      sortField: "mine_count_total",
    },
  };
  const def = map[category];
  const col = db.collection(def.collection);
  const baseFilter = { guildId };
  const sort = { [def.sortField]: -1 } as Record<string, 1 | -1>;

  const [docs, total] = await Promise.all([
    col.find(baseFilter).sort(sort).limit(limit).toArray(),
    col.countDocuments({
      ...baseFilter,
      [def.sortField]: { $gt: 0 },
    }),
  ]);

  const rows: LeaderboardRow[] = docs.map((d) => ({
    userId: String(d.userId ?? ""),
    value: Number((d as Record<string, unknown>)[def.sortField] ?? 0),
    sub: def.subRender ? def.subRender(d as Record<string, unknown>) : undefined,
  }));

  let myRank: number | null = null;
  let myValue: number | null = null;
  if (viewerId && !rows.some((r) => r.userId === viewerId)) {
    const me = await col.findOne({ userId: viewerId, guildId });
    if (me) {
      const v = Number((me as Record<string, unknown>)[def.sortField] ?? 0);
      myValue = v;
      myRank = v > 0
        ? (await col.countDocuments({
            ...baseFilter,
            [def.sortField]: { $gt: v },
          })) + 1
        : null;
    }
  } else if (viewerId) {
    const idx = rows.findIndex((r) => r.userId === viewerId);
    if (idx >= 0) {
      myRank = idx + 1;
      myValue = rows[idx].value;
    }
  }
  // 對齊：period 預留為未來時間區間支援，現階段一律 all
  void period;

  return {
    category,
    period,
    rows,
    total,
    myRank,
    myValue,
  };
}

// ── 樂透（LotteryDraws / LotteryTickets — 精簡：當期 + 近期已開）─────────────

export interface LotteryDrawSummary {
  drawId: string;
  lotteryType: string;
  drawNumber: number;
  pool: number;
  totalTickets: number;
  scheduledAt: Date;
  status: "open" | "settled" | "void" | string;
  winningNumbers?: number[];
  myTickets?: number;
}

export async function getLotteryDigest(
  guildId: string,
  userId: string,
): Promise<{ open: LotteryDrawSummary[]; recent: LotteryDrawSummary[] } | null> {
  const db = await getDonationDb();
  if (!db) return null;
  const drawsCol = db.collection("LotteryDraws");
  const ticketsCol = db.collection("LotteryTickets");

  const [openDocs, recentDocs] = await Promise.all([
    drawsCol.find({ status: "open" }).sort({ scheduledAt: 1 }).limit(6).toArray(),
    drawsCol
      .find({ status: "settled" })
      .sort({ scheduledAt: -1 })
      .limit(6)
      .toArray(),
  ]);

  // 為當期撈自己持票數
  const myTicketCounts = new Map<string, number>();
  await Promise.all(
    openDocs.map(async (d) => {
      const drawId = String(d.drawId);
      const count = await ticketsCol.countDocuments({
        drawId,
        userId,
        guildId,
      });
      myTicketCounts.set(drawId, count);
    }),
  );

  const map = (d: Record<string, unknown>): LotteryDrawSummary => ({
    drawId: String(d.drawId ?? ""),
    lotteryType: String(d.lotteryType ?? ""),
    drawNumber: Number(d.drawNumber ?? 0),
    pool: Number(d.pool ?? 0),
    totalTickets: Number(d.totalTickets ?? 0),
    scheduledAt:
      d.scheduledAt instanceof Date
        ? d.scheduledAt
        : new Date(String(d.scheduledAt ?? Date.now())),
    status: String(d.status ?? ""),
    winningNumbers: Array.isArray(d.winningNumbers)
      ? (d.winningNumbers as unknown[]).map((n) => Number(n))
      : undefined,
  });

  return {
    open: openDocs.map((d) => {
      const summary = map(d);
      summary.myTickets = myTicketCounts.get(summary.drawId) ?? 0;
      return summary;
    }),
    recent: recentDocs.map(map),
  };
}

// 對齊 bot src/features/lottery/lotteryConfig 或常見命名
export const LOTTERY_TYPE_LABELS: Record<string, { label: string; emoji: string }> =
  {
    daily: { label: "每日樂透", emoji: "🎟️" },
    weekly: { label: "週末大樂透", emoji: "🎰" },
    super: { label: "超級樂透", emoji: "💫" },
    mini: { label: "迷你樂透", emoji: "🪙" },
  };

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
