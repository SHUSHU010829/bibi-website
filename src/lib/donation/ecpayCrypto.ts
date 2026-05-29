import crypto from "node:crypto";

/**
 * ECPay / OPay 共用的 CheckMacValue 與 Data 加解密實作。
 * 兩家平台演算法完全相同，只有 HashKey / HashIV 不同。
 *
 * 文件依據：歐付寶直播主收款網址 API 技術文件 V1.0.0（附錄 1、附錄 2），
 * 綠界 https://developers.ecpay.com.tw/40999/ 對應段落。
 */

/**
 * .NET HttpUtility.UrlEncode 風格：
 * - 小寫 hex（%2f 而不是 %2F）
 * - 空白編成 + 而非 %20
 * - 保留字 -_.!*() 不編碼
 * - ' 編成 %27、~ 編成 %7e
 */
export function dotnetUrlEncode(s: string): string {
  return encodeURIComponent(s)
    .replace(/%20/g, "+")
    .replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase())
    .replace(/'/g, "%27")
    .replace(/~/g, "%7e");
}

/**
 * 把 webhook top-level params 序列化成 CheckMacValue 計算用的 key=value 字串。
 * 物件值（如 RpHeader）以 JSON.stringify（無空格）整段塞進去，**不**展平鍵。
 * 參考 ECPay V3 callback 規格：RpHeader 在簽章內是 JSON 字串 `{"Timestamp":...}`。
 */
function serializeForCheckMac(params: Record<string, unknown>): string {
  const entries: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(params)) {
    if (k === "CheckMacValue") continue;
    if (v === null || v === undefined) continue;
    const value = typeof v === "object" ? JSON.stringify(v) : String(v);
    entries.push([k, value]);
  }
  // .NET 預設 byte-order 排序；ASCII 大小寫敏感
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return entries.map(([k, v]) => `${k}=${v}`).join("&");
}

/**
 * 計算 CheckMacValue：
 *   1. 把所有 top-level 參數（除 CheckMacValue）序列化為 key=value，
 *      物件值用 JSON.stringify（無空格）
 *   2. 依 key 排序（byte order）後串連，前綴 HashKey=xxx&、後綴 HashIV=xxx
 *   3. .NET 風格 URL encode
 *   4. 全部轉小寫
 *   5. SHA256
 *   6. 轉大寫
 */
export function computeCheckMac(
  params: Record<string, unknown>,
  hashKey: string,
  hashIV: string,
): string {
  const body = serializeForCheckMac(params);
  const raw = `HashKey=${hashKey}&${body}&HashIV=${hashIV}`;
  return crypto
    .createHash("sha256")
    .update(dotnetUrlEncode(raw).toLowerCase())
    .digest("hex")
    .toUpperCase();
}

/** Constant-time string compare for CheckMacValue verification. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * AES-128-CBC + PKCS7 解密 + URL decode + JSON parse。
 * 加密流程是：JSON → URL encode → AES encrypt → base64。
 * 解密反向：base64 decode → AES decrypt → URL decode → JSON parse。
 */
export function decryptData(
  encrypted: string,
  hashKey: string,
  hashIV: string,
): Record<string, unknown> {
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
  // 平台可能用 + 表示空白（form encode 風格），先還原成 %20 再 decode
  const decoded = decodeURIComponent(urlEncoded.replace(/\+/g, "%20"));
  return JSON.parse(decoded) as Record<string, unknown>;
}
