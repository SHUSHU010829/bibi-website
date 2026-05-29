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

function sha256Upper(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex").toUpperCase();
}

/**
 * V3 callback CheckMacValue 候選實作集。實機驗證階段全部試一輪，
 * 找到能對上的留下即可。
 */
type Candidate = {
  name: string;
  mac: string;
};

export function computeCheckMacCandidates(
  params: Record<string, unknown>,
  hashKey: string,
  hashIV: string,
): Candidate[] {
  const noMac: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === "CheckMacValue") continue;
    if (v === null || v === undefined) continue;
    noMac[k] = v;
  }

  // A. 全參數、排序、物件 JSON.stringify、dotnet urlencode
  const entriesA: Array<[string, string]> = Object.entries(noMac).map(([k, v]) => [
    k,
    typeof v === "object" ? JSON.stringify(v) : String(v),
  ]);
  entriesA.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const rawA = `HashKey=${hashKey}&${entriesA.map(([k, v]) => `${k}=${v}`).join("&")}&HashIV=${hashIV}`;
  const macA = sha256Upper(dotnetUrlEncode(rawA).toLowerCase());

  // B. 全參數、排序、物件展平成 RpHeader.Timestamp 等扁平鍵
  const flat: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(noMac)) {
    if (typeof v === "object" && v !== null) {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
        if (v2 === null || v2 === undefined) continue;
        flat.push([`${k}.${k2}`, String(v2)]);
      }
    } else {
      flat.push([k, String(v)]);
    }
  }
  flat.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const rawB = `HashKey=${hashKey}&${flat.map(([k, v]) => `${k}=${v}`).join("&")}&HashIV=${hashIV}`;
  const macB = sha256Upper(dotnetUrlEncode(rawB).toLowerCase());

  // C. 只簽 Data 一個欄位
  const dataStr = String(noMac.Data ?? "");
  const rawC = `HashKey=${hashKey}&Data=${dataStr}&HashIV=${hashIV}`;
  const macC = sha256Upper(dotnetUrlEncode(rawC).toLowerCase());

  // D. 只簽 Data，不做 URL encode（直接 raw 串 + SHA256）
  const macD = sha256Upper(`HashKey=${hashKey}&Data=${dataStr}&HashIV=${hashIV}`);

  // E. 全 JSON 字串：HashKey + JSON.stringify(body) + HashIV，dotnet urlencode
  const rawE = `HashKey=${hashKey}&${JSON.stringify(noMac)}&HashIV=${hashIV}`;
  const macE = sha256Upper(dotnetUrlEncode(rawE).toLowerCase());

  // F. 全 JSON 字串：HashKey + JSON.stringify(body) + HashIV，不做 URL encode
  const macF = sha256Upper(`HashKey=${hashKey}&${JSON.stringify(noMac)}&HashIV=${hashIV}`);

  // G. 全參數 lowercase 排序（保留以防排序行為不同）
  const entriesG = [...entriesA].sort(([a], [b]) =>
    a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0,
  );
  const rawG = `HashKey=${hashKey}&${entriesG.map(([k, v]) => `${k}=${v}`).join("&")}&HashIV=${hashIV}`;
  const macG = sha256Upper(dotnetUrlEncode(rawG).toLowerCase());

  return [
    { name: "A_full_jsonObj_byteSort", mac: macA },
    { name: "B_full_flatObj_byteSort", mac: macB },
    { name: "C_dataOnly_urlEncoded", mac: macC },
    { name: "D_dataOnly_raw", mac: macD },
    { name: "E_jsonBody_urlEncoded", mac: macE },
    { name: "F_jsonBody_raw", mac: macF },
    { name: "G_full_jsonObj_lowerSort", mac: macG },
  ];
}

/**
 * 預設的計算（沿用 A 變體）。verify 流程裡會 fan-out 所有 candidate。
 */
export function computeCheckMac(
  params: Record<string, unknown>,
  hashKey: string,
  hashIV: string,
): string {
  return computeCheckMacCandidates(params, hashKey, hashIV)[0].mac;
}

/** 任一候選對上即視為有效，回傳對上的 candidate 名稱供 log。 */
export function findMatchingCheckMac(
  params: Record<string, unknown>,
  hashKey: string,
  hashIV: string,
  incoming: string,
): { matched: true; algo: string } | { matched: false; candidates: Candidate[] } {
  const candidates = computeCheckMacCandidates(params, hashKey, hashIV);
  for (const c of candidates) {
    if (c.mac.length === incoming.length && safeEqual(c.mac, incoming)) {
      return { matched: true, algo: c.name };
    }
  }
  return { matched: false, candidates };
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
