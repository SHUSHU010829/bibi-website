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
  /** Phase H+：武器副屬性 DEF（減傷） */
  def: number;
  critRate: number;
  durability: number | null;
}

export const WEAPONS: Record<string, WeaponDef> = {
  fist: { name: "赤手空拳", emoji: "👊", atk: 0, def: 0, critRate: 0, durability: null },
  iron_sword: { name: "鐵劍", emoji: "🗡️", atk: 25, def: 5, critRate: 0, durability: 40 },
  steel_sword: { name: "鋼劍", emoji: "⚔️", atk: 50, def: 10, critRate: 0.03, durability: 45 },
  gold_sword: { name: "黃金劍", emoji: "🌟", atk: 80, def: 18, critRate: 0.06, durability: 60 },
  diamond_sword: { name: "鑽石劍", emoji: "💎", atk: 120, def: 28, critRate: 0.1, durability: 80 },
  legendary_sword: { name: "傳說之劍", emoji: "🔥", atk: 180, def: 40, critRate: 0.2, durability: 120 },
};

// 基礎 ATK（dungeon.baseAtk），單獨拿出來方便加總顯示
export const DUNGEON_BASE_ATK = 20;

// ── Phase H+ 盾牌 ────────────────────────────────────────────────────────────

export interface ShieldDef {
  name: string;
  emoji: string;
  def: number;
  blockRate: number;
  reflectRate: number;
  durability: number;
  unlockLevel: number;
  tier: "v1" | "v2";
}

export const SHIELDS: Record<string, ShieldDef> = {
  iron_shield:   { name: "鐵盾",   emoji: "🪨", def: 10, blockRate: 0.25, reflectRate: 0,    durability: 50,  unlockLevel: 5,  tier: "v1" },
  steel_shield:  { name: "鋼盾",   emoji: "⚙️", def: 18, blockRate: 0.30, reflectRate: 0,    durability: 60,  unlockLevel: 15, tier: "v1" },
  gold_shield:   { name: "黃金盾", emoji: "🟡", def: 28, blockRate: 0.35, reflectRate: 0.05, durability: 70,  unlockLevel: 30, tier: "v2" },
  diamond_shield:{ name: "鑽石盾", emoji: "💠", def: 42, blockRate: 0.45, reflectRate: 0.10, durability: 90,  unlockLevel: 50, tier: "v2" },
  legendary_shield: { name: "傳說之盾", emoji: "🔥", def: 65, blockRate: 0.60, reflectRate: 0.20, durability: 120, unlockLevel: 75, tier: "v2" },
};

// ── Phase H+ 副本主題 / 樓層 ──────────────────────────────────────────────

export interface DungeonThemeDef {
  id: string;
  name: string;
  emoji: string;
}
export const DUNGEON_THEMES: Record<string, DungeonThemeDef> = {
  mine:  { id: "mine",  name: "礦坑", emoji: "⛏️" },
  ruins: { id: "ruins", name: "廢墟", emoji: "🏛️" },
  ice:   { id: "ice",   name: "冰窟", emoji: "❄️" },
};

export interface DungeonFloorDef {
  floor: number;
  name: string;
  emoji: string;
  staminaCost: number;
  rewardMultiplier: number;
}
export const DUNGEON_FLOORS: DungeonFloorDef[] = [
  { floor: 1, name: "廢棄礦坑", emoji: "🏚️", staminaCost: 1, rewardMultiplier: 1.0 },
  { floor: 2, name: "礦工迷宮", emoji: "⛏️", staminaCost: 1, rewardMultiplier: 1.3 },
  { floor: 3, name: "古遺跡",   emoji: "🏛️", staminaCost: 2, rewardMultiplier: 1.7 },
  { floor: 4, name: "熔岩深淵", emoji: "🔥", staminaCost: 2, rewardMultiplier: 2.2 },
  { floor: 5, name: "虛空之門", emoji: "🌌", staminaCost: 3, rewardMultiplier: 3.0 },
];

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
  mining_stamina_potion: { id: "mining_stamina_potion", type: "mining_stamina_potion", category: "挖礦道具", name: "精力藥水", emoji: "🥤" },
  mining_hp_potion_small: { id: "mining_hp_potion_small", type: "mining_hp_potion_small", category: "挖礦道具", name: "生命藥水（小）", emoji: "💊" },
  mining_hp_potion_medium: { id: "mining_hp_potion_medium", type: "mining_hp_potion_medium", category: "挖礦道具", name: "生命藥水（中）", emoji: "💊" },
  mining_hp_potion_large: { id: "mining_hp_potion_large", type: "mining_hp_potion_large", category: "挖礦道具", name: "生命藥水（大）", emoji: "💊" },
  mining_cd_ticket: { id: "mining_cd_ticket", type: "mining_cd_ticket", category: "挖礦道具", name: "CD 縮短券", emoji: "🎫" },
  mining_backpack_expand: { id: "mining_backpack_expand", type: "mining_backpack", category: "挖礦道具", name: "背包擴充", emoji: "🎒" },
  mining_whetstone_inferior: { id: "mining_whetstone_inferior", type: "mining_whetstone_inferior", category: "挖礦道具", name: "劣質磨石", emoji: "🪨" },

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
  { id: "daily_messages", period: "daily", name: "文字活躍", description: "當日在伺服器傳送 ≥ 20 則訊息", reward: 200, target: 20 },
  { id: "daily_voice_30", period: "daily", name: "語音初段", description: "當日在語音頻道待滿 45 分鐘", reward: 150, target: 45 },
  { id: "daily_voice_60", period: "daily", name: "語音進階", description: "當日在語音頻道待滿 90 分鐘", reward: 100, target: 90 },
  { id: "daily_gamble", period: "daily", name: "賭桌新手", description: "完成任意賭博遊戲一局（不論輸贏）", reward: 300, target: 1 },
  { id: "daily_stock", period: "daily", name: "股市初探", description: "完成任意一筆股票交易（買或賣）", reward: 250, target: 1 },
  { id: "daily_mine_3", period: "daily", name: "礦工打卡", description: "當日成功挖礦 ≥ 5 次", reward: 150, target: 5 },
  { id: "daily_sell_ore", period: "daily", name: "礦石出清", description: "當日完成任意一次賣礦", reward: 100, target: 1 },
  { id: "daily_rare_ore", period: "daily", name: "幸運礦工", description: "當日挖到稀有礦石（鐵礦／黃金／鑽石）≥ 1 次", reward: 200, target: 1 },
  { id: "daily_work", period: "daily", name: "今日打工", description: "當日完成任意一次打工", reward: 100, target: 1 },
  { id: "daily_dungeon_win", period: "daily", name: "地城獵人", description: "當日地下城戰鬥勝利 ≥ 3 次", reward: 250, target: 3 },
  { id: "daily_dungeon_10", period: "daily", name: "地城常客", description: "當日完成地下城探索 ≥ 15 次（不論勝負）", reward: 350, target: 15 },
  { id: "daily_dungeon_floor3", period: "daily", name: "深淵探索", description: "當日通關 3F 以上樓層 ≥ 3 次", reward: 400, target: 3 },
  { id: "daily_farm_harvest", period: "daily", name: "今日豐收", description: "當日從農場收成 ≥ 4 次", reward: 200, target: 4 },
  { id: "daily_farm_plant", period: "daily", name: "晨間耕作", description: "當日種植任意作物 ≥ 1 次", reward: 100, target: 1 },
];

export const WEEKLY_QUESTS: QuestDef[] = [
  { id: "weekly_attendance", period: "weekly", name: "週週出席", description: "本週簽到 ≥ 5 天", reward: 1200, target: 5 },
  { id: "weekly_messages", period: "weekly", name: "活躍市民", description: "本週發送訊息 ≥ 120 則", reward: 1500, target: 120 },
  { id: "weekly_popular", period: "weekly", name: "人氣王", description: "本週收到 ≥ 40 個表情符號反應", reward: 2000, target: 40 },
  { id: "weekly_mine_20", period: "weekly", name: "週末礦工", description: "本週成功挖礦 ≥ 40 次", reward: 1000, target: 40 },
  { id: "weekly_diamond", period: "weekly", name: "鑽石獵人", description: "本週挖到鑽石 ≥ 1 次", reward: 2500, target: 1 },
  { id: "weekly_craft", period: "weekly", name: "鍛造師週記", description: "本週完成合成 ≥ 6 次", reward: 1200, target: 6 },
  { id: "weekly_sell_value", period: "weekly", name: "礦石大亨", description: "本週賣礦累積收入 ≥ 3,000 金幣", reward: 1500, target: 3000 },
  { id: "weekly_dungeon", period: "weekly", name: "週週下城", description: "本週完成地下城探索 ≥ 70 次", reward: 1500, target: 70 },
  { id: "weekly_dungeon_win", period: "weekly", name: "深淵征服者", description: "本週地下城戰鬥勝利 ≥ 20 次", reward: 1800, target: 20 },
  { id: "weekly_mini_boss", period: "weekly", name: "屠龍週", description: "本週擊敗 mini-BOSS ≥ 1 次（5F 通關 5 次後解鎖挑戰）", reward: 2500, target: 1 },
  { id: "weekly_dungeon_ice", period: "weekly", name: "冰窟洗禮", description: "本週冰窟通關 ≥ 3 次（需先解鎖冰窟主題）", reward: 2200, target: 3 },
  { id: "weekly_farm_harvest", period: "weekly", name: "週末市集", description: "本週累積收成 ≥ 25 次", reward: 1500, target: 25 },
  { id: "weekly_farm_rose", period: "weekly", name: "黑玫瑰栽培家", description: "本週成功收成黑玫瑰 ≥ 1 次", reward: 2500, target: 1 },
  { id: "weekly_cook_50", period: "weekly", name: "週末大廚", description: "本週完成烹飪 ≥ 50 次", reward: 6000, target: 50 },
];

// 任務指派制（鏡像 src/config/quests.json questSystem.assignment）
export const QUEST_ASSIGNMENT = {
  dailyPoolSize: 5,
  weeklyPoolSize: 5,
  rerollCost: { daily: 100, weekly: 200 },
  skipCost: { daily: 30, weekly: 100 },
  actionLimit: { daily: 4, weekly: 2 },
} as const;

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

// ── 烹飪食譜 / 食物倉庫衰減 ─────────────────────────────────────────────────
// 鏡像自 bibi-bot src/config/fishing.json 的 recipes / foodStorage。
// recipes 只保留顯示用的最小集合（name / emoji / 兩種 buff label）；衰減曲線
// 與 bot 端 src/features/fishing/foodBag.js 同義，網站只讀，不會回寫 DB。

export interface RecipeDef {
  name: string;
  emoji: string;
  buffLabel: string;
  coalBuffLabel: string | null;
}

export const RECIPES: Record<string, RecipeDef> = {
  fish_bento:       { name: "魚排便當",     emoji: "🍱", buffLabel: "接下來 3 次打工收入 +25%",                coalBuffLabel: "接下來 4 次打工收入 +35%（煤炭烤製）" },
  seafood_feast:    { name: "海鮮拼盤",     emoji: "🍤", buffLabel: "接下來 3 次釣魚 成功率/稀有度提升",        coalBuffLabel: "接下來 4 次釣魚 成功率/稀有度提升（煤炭烤製）" },
  shark_noodle:     { name: "鯊魚麵",       emoji: "🍜", buffLabel: "地下城 ATK +20",                          coalBuffLabel: "地下城 ATK +35（煤炭烤製）" },
  octopus_rice:     { name: "章魚飯",       emoji: "🐙", buffLabel: "挖礦幸運 +8%（共 3 次）",                  coalBuffLabel: "挖礦幸運 +12%（共 4 次，煤炭烤製）" },
  lava_hotpot:      { name: "熔岩鍋",       emoji: "🍲", buffLabel: "全屬性 +15%（60 分鐘）",                    coalBuffLabel: "全屬性 +20%（90 分鐘，煤炭烤製）" },
  veggie_fish_soup: { name: "蔬菜魚湯",     emoji: "🥣", buffLabel: "接下來 3 次收成 +25%",                      coalBuffLabel: "接下來 4 次收成 +35%（煤炭烤製）" },
  corn_chowder:     { name: "玉米巧達濃湯", emoji: "🌽", buffLabel: "全屬性 +10%（90 分鐘）",                    coalBuffLabel: "全屬性 +15%（120 分鐘，煤炭烤製）" },
  rose_elixir:      { name: "黑玫瑰精華",   emoji: "🌹", buffLabel: "全屬性 +25%（60 分鐘）",                    coalBuffLabel: "全屬性 +30%（90 分鐘，煤炭烤製）" },
  dried_small_fish: { name: "小魚乾",       emoji: "🐟", buffLabel: "接下來 2 次釣魚 成功率/稀有度提升",        coalBuffLabel: "接下來 3 次釣魚 成功率/稀有度提升（煤炭烤製）" },
  crucian_sushi:    { name: "鯽魚握壽司",   emoji: "🍣", buffLabel: "挖礦幸運 +6%（共 2 次）",                  coalBuffLabel: "挖礦幸運 +9%（共 3 次，煤炭烤製）" },
  shark_sashimi:    { name: "鯊魚生魚片",   emoji: "🔪", buffLabel: "地下城 ATK +18（120 分鐘）",               coalBuffLabel: "地下城 ATK +28（180 分鐘，煤炭烤製）" },
  octopus_skewer:   { name: "章魚串燒",     emoji: "🍢", buffLabel: "接下來 3 次打工收入 +35%",                  coalBuffLabel: "接下來 4 次打工收入 +45%（煤炭烤製）" },
  lava_sashimi:     { name: "熔岩雙拼刺身", emoji: "🌶️", buffLabel: "全屬性 +12%（60 分鐘）",                    coalBuffLabel: "全屬性 +18%（90 分鐘，煤炭烤製）" },
  carrot_juice:     { name: "鮮榨紅蘿蔔汁", emoji: "🥤", buffLabel: "接下來 3 次釣魚 成功率/稀有度提升",        coalBuffLabel: "接下來 4 次釣魚 成功率/稀有度提升（煤炭烤製）" },
  grilled_corn:     { name: "奶油烤玉米",   emoji: "🌽", buffLabel: "接下來 3 次打工收入 +30%",                  coalBuffLabel: "接下來 4 次打工收入 +40%（煤炭烤製）" },
  garden_soup:      { name: "田園蔬菜湯",   emoji: "🍲", buffLabel: "接下來 3 次收成 +30%",                      coalBuffLabel: "接下來 4 次收成 +40%（煤炭烤製）" },
  strawberry_tart:  { name: "草莓塔",       emoji: "🍰", buffLabel: "挖礦幸運 +12%（共 3 次）",                 coalBuffLabel: "挖礦幸運 +16%（共 4 次，煤炭烤製）" },
  harvest_feast:    { name: "豐收盛宴",     emoji: "🥗", buffLabel: "全屬性 +12%（60 分鐘）",                    coalBuffLabel: "全屬性 +18%（90 分鐘，煤炭烤製）" },
};

export const FOOD_STORAGE = {
  freshUntilMs: 43_200_000,   // 12h
  zeroAtMs:    604_800_000,   // 7d
  coalMultiplier: 1.5,
} as const;

// ── 農場 / 作物 / 肥料（鏡像 src/config/farming.json）────────────────────────

export interface CropDef {
  name: string;
  emoji: string;
  plantCost: number;
  growMs: number;
  rotMs: number;
  payout: [number, number];
  seedKey?: string;
  seedOptional?: boolean;
  sellPrice: number;
}

export const CROPS: Record<string, CropDef> = {
  carrot:     { name: "紅蘿蔔", emoji: "🥕", plantCost: 20,  growMs: 7_200_000,  rotMs: 14_400_000, payout: [50, 80],     sellPrice: 30 },
  corn:       { name: "玉米",   emoji: "🌽", plantCost: 60,  growMs: 21_600_000, rotMs: 21_600_000, payout: [150, 200],   sellPrice: 90 },
  strawberry: { name: "草莓",   emoji: "🍓", plantCost: 150, growMs: 43_200_000, rotMs: 28_800_000, payout: [400, 500],   seedKey: "seed_strawberry", seedOptional: true, sellPrice: 250 },
  black_rose: { name: "黑玫瑰", emoji: "🌹", plantCost: 500, growMs: 86_400_000, rotMs: 43_200_000, payout: [1200, 1500], seedKey: "seed_black_rose", sellPrice: 900 },
};

export const SEEDS: Record<string, { name: string; emoji: string; cropKey: string }> = {
  seed_carrot:     { name: "紅蘿蔔種子", emoji: "🌱", cropKey: "carrot" },
  seed_corn:       { name: "玉米種子",   emoji: "🌱", cropKey: "corn" },
  seed_strawberry: { name: "草莓種子",   emoji: "🌱", cropKey: "strawberry" },
  seed_black_rose: { name: "黑玫瑰種子", emoji: "🥀", cropKey: "black_rose" },
};

export const FERTILIZERS: Record<string, { name: string; emoji: string }> = {
  coal:          { name: "煤炭灰",    emoji: "🪵" },
  compost:       { name: "廚餘堆肥",  emoji: "🍂" },
  monster_slime: { name: "怪物黏液",  emoji: "💧" },
  moonlight_dew: { name: "月光露水",  emoji: "🌟" },
};

export const FARM_PLOT_TIERS = [
  { count: 2, cost: 0 },
  { count: 4, cost: 3_000 },
  { count: 6, cost: 10_000 },
  { count: 8, cost: 30_000 },
] as const;

export const FARM_MAX_PLOTS = 8;

export type CropStatus = "empty" | "growing" | "ready" | "rotted" | "raided";

export const CROP_STATUS_LABELS: Record<CropStatus, { label: string; tag: string }> = {
  empty:   { label: "空地",   tag: "⬜" },
  growing: { label: "成長中", tag: "🌿" },
  ready:   { label: "可收成", tag: "✨" },
  rotted:  { label: "腐爛",   tag: "🥀" },
  raided:  { label: "被偷襲", tag: "💥" },
};

// ── 公會（鏡像 src/config/guild_club.json）──────────────────────────────────

export interface GuildClubBuff {
  type: string;
  value: number;
}

export interface GuildClubLevelDef {
  level: number;
  threshold: number;
  maxMembers: number;
  buffs: GuildClubBuff[];
}

export const GUILD_CLUB_LEVELS: GuildClubLevelDef[] = [
  { level: 1, threshold: 0,      maxMembers: 10, buffs: [] },
  { level: 2, threshold: 10_000, maxMembers: 12, buffs: [
    { type: "mining_qty_bonus", value: 1 },
  ]},
  { level: 3, threshold: 50_000, maxMembers: 15, buffs: [
    { type: "mining_qty_bonus", value: 1 },
    { type: "work_income_multiplier", value: 0.1 },
  ]},
  { level: 4, threshold: 150_000, maxMembers: 18, buffs: [
    { type: "mining_qty_bonus", value: 1 },
    { type: "work_income_multiplier", value: 0.1 },
    { type: "dungeon_stamina_max", value: 1 },
    { type: "boss_atk_pct", value: 0.05 },
  ]},
  { level: 5, threshold: 500_000, maxMembers: 20, buffs: [
    { type: "mining_qty_bonus", value: 1 },
    { type: "work_income_multiplier", value: 0.1 },
    { type: "dungeon_stamina_max", value: 1 },
    { type: "mining_luck_pct", value: 0.05 },
    { type: "boss_atk_pct", value: 0.1 },
    { type: "boss_attack_limit_bonus", value: 1 },
  ]},
];

export function guildClubBuffLabel(buff: GuildClubBuff): string {
  switch (buff.type) {
    case "mining_qty_bonus":         return `⛏️ 挖礦數量 +${buff.value}`;
    case "mining_luck_pct":          return `🍀 挖礦幸運 +${Math.round(buff.value * 100)}%`;
    case "work_income_multiplier":   return `💼 打工收入 +${Math.round(buff.value * 100)}%`;
    case "dungeon_stamina_max":      return `🛡️ 地下城體力上限 +${buff.value}`;
    case "boss_atk_pct":             return `💥 Boss ATK +${Math.round(buff.value * 100)}%`;
    case "boss_attack_limit_bonus":  return `🔁 Boss 出手次數 +${buff.value}`;
    default:                         return `${buff.type} +${buff.value}`;
  }
}

export const GUILD_CLUB_ROLE_LABELS: Record<string, string> = {
  leader:      "👑 會長",
  vice_leader: "🛡️ 副會長",
  member:      "成員",
};

// ── 食物 buff（active_food_buffs.type）──────────────────────────────────────

export const FOOD_BUFF_TYPE_LABELS: Record<string, string> = {
  work_income:    "💼 打工收入",
  dungeon_atk:    "⚔️ 地下城 ATK",
  dungeon_def:    "🛡️ 地下城 DEF",
  dungeon_hp_max: "❤️ 地下城 HP 上限",
  mine_luck:      "🍀 挖礦幸運",
  all_boost:      "✨ 全屬性",
  fish_fortune:   "🎣 釣魚運",
  farm_yield:     "🌾 收成倍率",
};

// ── 股票（鏡像 src/config/stocks.json stockSystem.pool）────────────────────

export interface StockDef {
  symbol: string;
  name: string;
  initialPrice: number;
  type: string;
  dividendYield: number;
}

export const STOCKS: Record<string, StockDef> = {
  TSPP: { symbol: "TSPP", name: "嗶積電",   initialPrice: 500, type: "tech", dividendYield: 0.02 },
  UPPI: { symbol: "UPPI", name: "統嗶超商", initialPrice: 300, type: "blue", dividendYield: 0.04 },
  EGPP: { symbol: "EGPP", name: "嗶嗶海運", initialPrice: 120, type: "meme", dividendYield: 0 },
  CTPP: { symbol: "CTPP", name: "嗶嗶金控", initialPrice: 800, type: "blue", dividendYield: 0.05 },
  MTKP: { symbol: "MTKP", name: "嗶發科",   initialPrice: 200, type: "tech", dividendYield: 0.025 },
};

export const STOCK_TYPE_LABELS: Record<string, string> = {
  tech: "🧪 科技",
  blue: "🏛️ 藍籌",
  meme: "🎢 迷因",
};
