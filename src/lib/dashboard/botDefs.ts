// 鏡像自 bibi-bot 的 config 與 features definition。
//
// 來源：
//  - mining ores/pickaxes      → src/config/mining.json
//  - fishing rods/fish/recipes → src/config/fishing.json
//  - dungeon weapons           → src/config/dungeon.json
//  - shop items                → src/config/shop.json
//  - daily/weekly quests       → src/config/quests.json
//  - badges                    → src/features/leveling/badgeDefinitions.js
//
// 任何 bot 端的改動請同步這裡，否則網站會顯示舊資訊或 fallback "(id)" 字串。

// ── ores / pickaxes / weapons / rods / fish ─────────────────────────────────

export interface MineralDef {
  name: string;
  emoji: string;
  rarity?: string;
  price?: number;
}

export const ORES: Record<string, MineralDef> = {
  stone: { name: "石頭", emoji: "🪨", rarity: "普通", price: 8 },
  coal: { name: "煤炭", emoji: "🪵", rarity: "普通", price: 20 },
  iron: { name: "鐵礦", emoji: "🔩", rarity: "稀有", price: 60 },
  gold: { name: "黃金", emoji: "🥇", rarity: "稀有", price: 200 },
  diamond: { name: "鑽石", emoji: "💎", rarity: "傳說", price: 800 },
};

export const FISH: Record<string, MineralDef> = {
  small_fish: { name: "小雜魚", emoji: "🐟", rarity: "普通", price: 5 },
  crucian: { name: "鯽魚", emoji: "🎣", rarity: "普通", price: 15 },
  shark: { name: "鯊魚", emoji: "🦈", rarity: "稀有", price: 60 },
  octopus: { name: "章魚", emoji: "🐙", rarity: "稀有", price: 150 },
  lava_fish: { name: "熔岩魚", emoji: "🐉", rarity: "傳說", price: 600 },
};

export interface PickaxeDef {
  name: string;
  emoji: string;
  luckBonus: number;
  qtyBonus: number;
  cdReductionMs: number;
  durability: number | null;
}

export const PICKAXES: Record<string, PickaxeDef> = {
  wood: { name: "木鎬", emoji: "⛏️", luckBonus: 0, qtyBonus: 0, cdReductionMs: 0, durability: null },
  iron: { name: "鐵鎬", emoji: "⛏️", luckBonus: 0.05, qtyBonus: 0, cdReductionMs: 1800000, durability: 50 },
  gold: { name: "黃金鎬", emoji: "⛏️", luckBonus: 0.08, qtyBonus: 0, cdReductionMs: 2700000, durability: 50 },
  diamond: { name: "鑽石鎬", emoji: "⛏️", luckBonus: 0.12, qtyBonus: 1, cdReductionMs: 3600000, durability: 50 },
};

export interface RodDef {
  name: string;
  emoji: string;
  successBonus: number;
  rareBonus: number;
  qtyBonus: number;
  cdReductionMs: number;
  durability: number | null;
}

export const RODS: Record<string, RodDef> = {
  bamboo: { name: "竹釣竿", emoji: "🎣", successBonus: 0, rareBonus: 0, qtyBonus: 0, cdReductionMs: 0, durability: null },
  carbon: { name: "碳纖釣竿", emoji: "🎏", successBonus: 0.12, rareBonus: 0.5, qtyBonus: 0, cdReductionMs: 1800000, durability: 50 },
  gold: { name: "黃金釣竿", emoji: "🥇", successBonus: 0.2, rareBonus: 1.0, qtyBonus: 0, cdReductionMs: 2700000, durability: 50 },
  mythril: { name: "秘銀釣竿", emoji: "🔱", successBonus: 0.28, rareBonus: 1.5, qtyBonus: 1, cdReductionMs: 3600000, durability: 50 },
};

export interface WeaponDef {
  name: string;
  emoji: string;
  atk: number;
  critRate: number;
  durability: number | null;
}

export const WEAPONS: Record<string, WeaponDef> = {
  fist: { name: "赤手空拳", emoji: "👊", atk: 0, critRate: 0, durability: null },
  iron_sword: { name: "鐵劍", emoji: "🗡️", atk: 25, critRate: 0, durability: 60 },
  steel_sword: { name: "鋼劍", emoji: "⚔️", atk: 50, critRate: 0.03, durability: 60 },
  gold_sword: { name: "黃金劍", emoji: "🌟", atk: 80, critRate: 0.06, durability: 60 },
  diamond_sword: { name: "鑽石劍", emoji: "💎", atk: 120, critRate: 0.1, durability: 50 },
  legendary_sword: { name: "傳說之劍", emoji: "🔥", atk: 180, critRate: 0.2, durability: 80 },
};

// 基礎 ATK（dungeon.baseAtk），單獨拿出來方便加總顯示
export const DUNGEON_BASE_ATK = 20;

// ── shop items（精選會出現在背包/加成的 type）──────────────────────────────

export interface ShopItemDef {
  id: string;
  name: string;
  emoji?: string;
  category: string;
  description?: string;
  /** 對應 UserCoins.activeBuffs.source 與背包鍵 */
  type: string;
}

// 不複製整個 shop.json — 只 mirror 會在 dashboard 出現的條目（藥水、票券、釣魚道具、稱號）。
export const SHOP_ITEMS: Record<string, ShopItemDef> = {
  // 藥水 / Buff
  boost_xp_1h: { id: "boost_xp_1h", type: "xp_boost", category: "加成藥水", name: "XP 藥水 1.5×／1 小時", emoji: "🧪" },
  boost_xp_1d: { id: "boost_xp_1d", type: "xp_boost", category: "加成藥水", name: "XP 藥水 1.5×／1 日", emoji: "🧪" },
  boost_xp_double: { id: "boost_xp_double", type: "xp_boost", category: "加成藥水", name: "XP 雙倍藥水（1 小時）", emoji: "✨" },
  boost_xp_double_1d: { id: "boost_xp_double_1d", type: "xp_boost", category: "加成藥水", name: "XP 雙倍藥水（1 日）", emoji: "✨" },
  boost_coin_1h: { id: "boost_coin_1h", type: "coin_boost", category: "加成藥水", name: "金幣藥水 1.5×／1 小時", emoji: "💰" },
  boost_coin_1d: { id: "boost_coin_1d", type: "coin_boost", category: "加成藥水", name: "金幣藥水 1.5×／1 日", emoji: "💰" },
  boost_coin_double_1h: { id: "boost_coin_double_1h", type: "coin_boost", category: "加成藥水", name: "金幣雙倍藥水（1 小時）", emoji: "💸" },

  // 挖礦道具
  mining_luck_potion: { id: "mining_luck_potion", type: "mining_luck_potion", category: "挖礦道具", name: "幸運藥水", emoji: "🍀" },
  mining_stamina_potion: { id: "mining_stamina_potion", type: "mining_stamina_potion", category: "挖礦道具", name: "體力藥水", emoji: "🥤" },
  mining_cd_ticket: { id: "mining_cd_ticket", type: "mining_cd_ticket", category: "挖礦道具", name: "CD 縮短券", emoji: "🎫" },
  mining_backpack_expand: { id: "mining_backpack_expand", type: "mining_backpack", category: "挖礦道具", name: "背包擴充", emoji: "🎒" },
  mining_whetstone_inferior: { id: "mining_whetstone_inferior", type: "mining_whetstone_inferior", category: "挖礦道具", name: "劣質磨鎬石", emoji: "🪨" },

  // 釣魚道具
  fishing_rod_carbon: { id: "fishing_rod_carbon", type: "fishing_rod", category: "釣魚道具", name: "碳纖釣竿", emoji: "🎏" },
};

// ── daily / weekly quests ──────────────────────────────────────────────────

export interface QuestDef {
  id: string;
  name: string;
  description: string;
  reward: number;
  target: number;
  period: "daily" | "weekly";
}

export const DAILY_QUESTS: QuestDef[] = [
  { id: "daily_morning", period: "daily", name: "早安打卡", description: "07:00–10:00 在指定頻道發言", reward: 150, target: 1 },
  { id: "daily_messages", period: "daily", name: "文字活躍", description: "當日在伺服器傳送 ≥ 10 則訊息", reward: 200, target: 10 },
  { id: "daily_voice_30", period: "daily", name: "語音初段", description: "當日在語音頻道待滿 30 分鐘", reward: 150, target: 30 },
  { id: "daily_voice_60", period: "daily", name: "語音進階", description: "當日在語音頻道待滿 60 分鐘", reward: 100, target: 60 },
  { id: "daily_gamble", period: "daily", name: "賭桌新手", description: "完成任意賭博遊戲一局", reward: 300, target: 1 },
  { id: "daily_stock", period: "daily", name: "股市初探", description: "完成任意一筆股票交易", reward: 250, target: 1 },
  { id: "daily_mine_3", period: "daily", name: "礦工打卡", description: "當日成功挖礦 ≥ 3 次", reward: 150, target: 3 },
  { id: "daily_sell_ore", period: "daily", name: "礦石出清", description: "當日完成任意一次賣礦", reward: 100, target: 1 },
  { id: "daily_rare_ore", period: "daily", name: "幸運礦工", description: "當日挖到稀有礦石（鐵礦／黃金／鑽石）≥ 1 次", reward: 200, target: 1 },
  { id: "daily_work", period: "daily", name: "今日打工", description: "當日完成任意一次打工", reward: 100, target: 1 },
  { id: "daily_dungeon_win", period: "daily", name: "地城獵人", description: "當日地下城戰鬥勝利 ≥ 2 次", reward: 250, target: 2 },
  { id: "daily_dungeon_10", period: "daily", name: "地城常客", description: "當日完成地下城探索 ≥ 10 次", reward: 350, target: 10 },
];

export const WEEKLY_QUESTS: QuestDef[] = [
  { id: "weekly_attendance", period: "weekly", name: "週週出席", description: "本週簽到 ≥ 5 天", reward: 1200, target: 5 },
  { id: "weekly_messages", period: "weekly", name: "週話癆", description: "本週累積訊息 ≥ 100 則", reward: 1500, target: 100 },
  { id: "weekly_voice", period: "weekly", name: "週語音", description: "本週累積語音 ≥ 300 分鐘", reward: 1500, target: 300 },
  { id: "weekly_gamble", period: "weekly", name: "週賭神", description: "本週完成 ≥ 10 局賭博", reward: 1500, target: 10 },
  { id: "weekly_mine", period: "weekly", name: "週礦工", description: "本週挖礦 ≥ 20 次", reward: 1500, target: 20 },
  { id: "weekly_dungeon", period: "weekly", name: "週地城", description: "本週地下城探索 ≥ 30 次", reward: 2000, target: 30 },
  { id: "weekly_diamond", period: "weekly", name: "週鑽石", description: "本週挖到鑽石 ≥ 1 顆", reward: 3000, target: 1 },
];

// ── 等級徽章 ─────────────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: BadgeCategory;
  /** UserLevels 文件上的欄位 */
  field: "level" | "longestStreak" | "totalMessages" | "totalVoiceMinutes" | "totalReactionsReceived";
  threshold: number;
}

export type BadgeCategory = "level" | "streak" | "message" | "voice" | "social";

export const BADGE_CATEGORIES: Record<BadgeCategory, string> = {
  level: "🏆 等級成就",
  streak: "🔥 連勝成就",
  message: "💬 訊息成就",
  voice: "🎤 語音成就",
  social: "🤝 社交成就",
};

export const BADGES: BadgeDef[] = [
  { id: "level_5", category: "level", name: "新星", emoji: "⭐", description: "達到 Lv.5", field: "level", threshold: 5 },
  { id: "level_10", category: "level", name: "白銀勳章", emoji: "🥈", description: "達到 Lv.10", field: "level", threshold: 10 },
  { id: "level_25", category: "level", name: "黃金勳章", emoji: "🥇", description: "達到 Lv.25", field: "level", threshold: 25 },
  { id: "level_50", category: "level", name: "白金勳章", emoji: "💎", description: "達到 Lv.50", field: "level", threshold: 50 },
  { id: "level_100", category: "level", name: "傳說王者", emoji: "👑", description: "達到 Lv.100", field: "level", threshold: 100 },

  { id: "streak_3", category: "streak", name: "三日連登", emoji: "🌱", description: "連續簽到 3 天", field: "longestStreak", threshold: 3 },
  { id: "streak_7", category: "streak", name: "週末戰士", emoji: "🔥", description: "連續簽到 7 天", field: "longestStreak", threshold: 7 },
  { id: "streak_30", category: "streak", name: "全勤之月", emoji: "🏅", description: "連續簽到 30 天", field: "longestStreak", threshold: 30 },
  { id: "streak_100", category: "streak", name: "百日不墜", emoji: "💯", description: "連續簽到 100 天", field: "longestStreak", threshold: 100 },

  { id: "msg_100", category: "message", name: "話匣子", emoji: "💬", description: "累積 100 則訊息", field: "totalMessages", threshold: 100 },
  { id: "msg_1000", category: "message", name: "話癆", emoji: "📣", description: "累積 1,000 則訊息", field: "totalMessages", threshold: 1000 },
  { id: "msg_10000", category: "message", name: "嘴砲大師", emoji: "🎙️", description: "累積 10,000 則訊息", field: "totalMessages", threshold: 10000 },

  { id: "voice_1h", category: "voice", name: "初登麥", emoji: "🎤", description: "累積語音 1 小時", field: "totalVoiceMinutes", threshold: 60 },
  { id: "voice_10h", category: "voice", name: "麥霸", emoji: "🗣️", description: "累積語音 10 小時", field: "totalVoiceMinutes", threshold: 600 },
  { id: "voice_100h", category: "voice", name: "聲音之王", emoji: "👑", description: "累積語音 100 小時", field: "totalVoiceMinutes", threshold: 6000 },

  { id: "react_10", category: "social", name: "受歡迎", emoji: "❤️", description: "被加 10 個反應", field: "totalReactionsReceived", threshold: 10 },
  { id: "react_100", category: "social", name: "人氣王", emoji: "🌟", description: "被加 100 個反應", field: "totalReactionsReceived", threshold: 100 },
];
