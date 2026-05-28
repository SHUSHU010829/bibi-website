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
 * 把 webhook top-level params flatten 成 CheckMacValue 計算用的字串。
 * RpHeader 物件展開成 RpHeader.Timestamp 等扁平鍵。
 */
function flattenForCheckMac(
  params: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === "CheckMacValue") continue;
    if (v === null || v === undefined) continue;
    if (typeof v === "object") {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
        if (v2 === null || v2 === undefined) continue;
        out[`${k}.${k2}`] = String(v2);
      }
    } else {
      out[k] = String(v);
    }
  }
  return out;
}

/**
 * 計算 CheckMacValue：
 *   1. 依參數名 A-Z 排序（大小寫不敏感比較）
 *   2. 前綴 HashKey=xxx&、串連 key=value&...、後綴 HashIV=xxx
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
  const flat = flattenForCheckMac(params);
  const sortedKeys = Object.keys(flat).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
  const body = sortedKeys.map((k) => `${k}=${flat[k]}`).join("&");
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
