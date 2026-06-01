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
