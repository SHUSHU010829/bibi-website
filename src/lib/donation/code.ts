import crypto from "node:crypto";

// Crockford-ish base32 alphabet：去掉 0/1/I/L/O 避免目視認錯
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** 產生 6 字元短碼，例 "DON-AB12CD"。entropy ≈ 30 bits。 */
export function generateCode(): string {
  const bytes = crypto.randomBytes(6);
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `DON-${s}`;
}

/**
 * 從 PatronNote 抽取第一個合法 code。
 * 大小寫不敏感、允許前後有其他文字（"幫我抖內！DON-AB12CD 謝謝" 也能抽到）。
 */
export function extractCode(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text
    .toUpperCase()
    .match(/DON-([23456789A-HJKMNPQRSTUVWXYZ]{6})/);
  return m ? `DON-${m[1]}` : null;
}
