// 顯示用方案資料；數值權威定義在 bot 的 src/config/donation_tiers.json。
// 這裡只用於前端展示，實際發放以 bot 為準。

export type DonationTier = {
  id: string;
  emoji: string;
  name: string;
  amountLabel: string;
  amountMin: number;
  amountMax: number | null;
  defaultAmount: number;
  // 級距底金幣（換算錨點），須與 bot src/config/donation.json 的 coins 一致
  coins: number;
  perks: string[];
};

export const DONATION_TIERS: DonationTier[] = [
  {
    id: "coffee",
    emoji: "☕",
    name: "小額支持",
    amountLabel: "NT$50 – 149",
    amountMin: 50,
    amountMax: 149,
    defaultAmount: 100,
    coins: 500,
    perks: [
      "500 金幣起（依金額遞增）",
      "幸運藥水 × 3",
      "贊助者身分組（7 天）",
    ],
  },
  {
    id: "standard",
    emoji: "🎮",
    name: "一般贊助",
    amountLabel: "NT$150 – 499",
    amountMin: 150,
    amountMax: 499,
    defaultAmount: 300,
    coins: 2000,
    perks: [
      "2,000 金幣起（依金額遞增）",
      "CD 縮短券 × 5",
      "贊助者身分組（30 天）",
      "挖礦 luck +5%（30 天）",
    ],
  },
  {
    id: "premium",
    emoji: "💎",
    name: "大額贊助",
    amountLabel: "NT$500 – 999",
    amountMin: 500,
    amountMax: 999,
    defaultAmount: 600,
    coins: 6000,
    perks: [
      "6,000 金幣起（依金額遞增）",
      "贊助者身分組（90 天）",
      "限定卡面（永久）",
      "自訂稱號 30 天",
      "挖礦 luck +8%（90 天）",
    ],
  },
  {
    id: "vip",
    emoji: "👑",
    name: "頂級贊助",
    amountLabel: "NT$1,000+",
    amountMin: 1000,
    amountMax: null,
    defaultAmount: 1000,
    coins: 15000,
    perks: [
      "15,000 金幣起（依金額遞增）",
      "頂級贊助者身分組（永久）",
      "限定卡面（永久）",
      "自訂稱號 90 天",
      "挖礦 luck +12%（永久）",
      "可提名限定稱號",
    ],
  },
];

export function tierForAmount(amount: number): DonationTier | null {
  for (const t of DONATION_TIERS) {
    if (amount >= t.amountMin && (t.amountMax === null || amount <= t.amountMax)) {
      return t;
    }
  }
  return null;
}

/**
 * 依實際金額線性換算金幣（與 bot src/features/donation/code.js 的 coinsForAmount 同邏輯）。
 * 級距內由本階底金幣線性內插到下一階底金幣，最高階以本階費率每元延伸，
 * 四捨五入到 10 的倍數並保底。金額未達門檻回 0。僅供前端預覽，實際發放以 bot 為準。
 */
export function coinsForAmount(amount: number): number {
  for (let i = 0; i < DONATION_TIERS.length; i++) {
    const t = DONATION_TIERS[i];
    const inTier =
      amount >= t.amountMin && (t.amountMax === null || amount <= t.amountMax);
    if (!inTier) continue;

    const next = DONATION_TIERS[i + 1] ?? null;
    let coins: number;
    if (t.amountMax === null || !next) {
      const rate = t.coins / t.amountMin;
      coins = t.coins + (amount - t.amountMin) * rate;
    } else {
      const slope = (next.coins - t.coins) / (next.amountMin - t.amountMin);
      coins = t.coins + (amount - t.amountMin) * slope;
    }
    coins = Math.round(coins / 10) * 10;
    return Math.max(coins, t.coins);
  }
  return 0;
}
