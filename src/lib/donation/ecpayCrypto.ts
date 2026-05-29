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
 * 綠界 / 歐付寶 CheckMacValue 專用的 URL encode（.NET HttpUtility.UrlEncode 相容）。
 *
 * 綠界官方檢查碼機制：urlencode 後做 .NET 相容置換，把
 *   `- _ . ! * ( )` 還原成「字面字元（不編碼）」，空白編成 `+`。
 * 其餘字元一律 percent-encoded（後續 .toLowerCase() 轉小寫）。
 *
 * 實作對應：
 * - `encodeURIComponent` 預設就「不編」`- _ . ! ~ * ' ( )`，故 `! * ( )` 自然維持字面，
 *   與綠界規則一致 → 不可再額外編碼（先前誤編成 %21/%28/%29/%2A 導致 CheckMacValue
 *   在 donor 暱稱 / 留言含這些符號時驗證失敗）。
 * - 空白：`%20` → `+`。
 * - `'`：encodeURIComponent 不編，但綠界 urlencode 會編 → 補成 `%27`。
 * - `~`：encodeURIComponent 不編，但綠界 urlencode 會編 → 補成 `%7E`。
 */
export function uriEscapeDataString(s: string): string {
  return encodeURIComponent(s)
    .replace(/%20/g, "+")
    .replace(/'/g, "%27")
    .replace(/~/g, "%7E");
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
