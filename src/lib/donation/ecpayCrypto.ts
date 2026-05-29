import crypto from "node:crypto";

/**
 * ECPay / OPay 共用的 CheckMacValue 與 Data 加解密實作。
 * 兩家平台演算法完全相同，只有 HashKey / HashIV 不同。
 *
 * 文件依據：
 * - https://developers.ecpay.com.tw/?p=41068 「附錄 / 檢查碼機制」
 * - https://developers.ecpay.com.tw/?p=41032 「參數解密方式說明」
 *
 * V3 / 直播主版本與舊版商家版的演算法不同：
 *   舊版（全方位金流）：所有 form 欄位排序 → key=val&... → 用 HttpUtility.UrlEncode
 *   新版（直播主收款）：CheckMacValue = SHA256(URLEncode(HashKey + Data明文 + HashIV))
 *                       - Data 明文 = AES 解密 + URL decode 後的 JSON 字串
 *                       - URLEncode 用 Uri.EscapeDataString（RFC 3986 風格）
 */

/**
 * 模擬 .NET Uri.EscapeDataString：RFC 3986 unreserved 字元（A-Z a-z 0-9 - _ . ~）
 * 不編碼，其餘全部 percent-encoded（大寫 hex；後續流程會 .toLowerCase()）。
 *
 * 與 JS 內建 encodeURIComponent 差別：
 * - encodeURIComponent 保留 `! * ' ( )`（RFC 2396 mark），這裡要補編碼
 * - 空白編成 %20（不是 +）
 */
export function uriEscapeDataString(s: string): string {
  return encodeURIComponent(s)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

/**
 * AES-128-CBC + PKCS7 解密，回傳 URL decode 後的「Data 明文」JSON 字串。
 * CheckMacValue 計算與業務 JSON parse 都從這個字串開始。
 */
export function decryptDataToString(
  encrypted: string,
  hashKey: string,
  hashIV: string,
): string {
  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    Buffer.from(hashKey, "utf8"),
    Buffer.from(hashIV, "utf8"),
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);
  const urlEncoded = decrypted.toString("utf8");
  // 平台用 form-style 編碼，+ 表示空白
  return decodeURIComponent(urlEncoded.replace(/\+/g, "%20"));
}

/**
 * 解密 + JSON parse。給業務邏輯用。
 */
export function decryptData(
  encrypted: string,
  hashKey: string,
  hashIV: string,
): Record<string, unknown> {
  return JSON.parse(decryptDataToString(encrypted, hashKey, hashIV));
}

/**
 * CheckMacValue 計算（V3 直播主版本）：
 *   1. raw = HashKey + Data明文 + HashIV
 *   2. URL encode（Uri.EscapeDataString 風格）
 *   3. 全部轉小寫（含原本大寫字母）
 *   4. SHA256
 *   5. 轉大寫
 */
export function computeCheckMac(
  dataPlaintext: string,
  hashKey: string,
  hashIV: string,
): string {
  const raw = hashKey + dataPlaintext + hashIV;
  const encoded = uriEscapeDataString(raw).toLowerCase();
  return crypto
    .createHash("sha256")
    .update(encoded)
    .digest("hex")
    .toUpperCase();
}

/** Constant-time string compare for CheckMacValue verification. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
