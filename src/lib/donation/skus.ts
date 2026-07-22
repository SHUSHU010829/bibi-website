// 獨立小額商品（SKU）— 顯示用資料；權威定義在 bot 的 src/config/donation.json 的 donation.skus。
// 走與贊助相同的綠界／歐付寶抖內連結付款（付固定金額 + 填 code 對帳），
// 但發放只給該商品的道具，不套依金額換算的方案回饋。

export type DonationSku = {
  id: string;
  emoji: string;
  name: string;
  amount: number;
  qty: number;
  perks: string[];
};

export const DONATION_SKUS: DonationSku[] = [
  {
    id: "mining_pass_x1",
    emoji: "🎟️",
    name: "連續挖礦通行證 ×1",
    amount: 50,
    qty: 1,
    perks: ["連續挖礦通行證 × 1", "啟用後 1 小時內無視等級連續挖礦"],
  },
  {
    id: "mining_pass_x3",
    emoji: "🎟️",
    name: "連續挖礦通行證 ×3",
    amount: 100,
    qty: 3,
    perks: ["連續挖礦通行證 × 3", "比單張省更多，適合常挖"],
  },
  {
    id: "mining_pass_x5",
    emoji: "🎟️",
    name: "連續挖礦通行證 ×5",
    amount: 150,
    qty: 5,
    perks: ["連續挖礦通行證 × 5", "每張最划算"],
  },
];

export function skuById(id: string): DonationSku | null {
  return DONATION_SKUS.find((s) => s.id === id) ?? null;
}
