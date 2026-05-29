import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { uriEscapeDataString, computeCheckMac } from "./ecpayCrypto.ts";

/**
 * 獨立的參考實作：PHP `urlencode()` + 綠界 .NET 相容置換表。
 * 與被測程式碼「不共用任何邏輯」，純粹照官方檢查碼機制文件重寫，
 * 用來交叉驗證 computeCheckMac / uriEscapeDataString 的正確性。
 *
 * 若有人把 `! ( ) *` 的編碼加回 uriEscapeDataString（先前導致 donor
 * 暱稱 / 留言含這些符號時 CheckMacValue 驗證失敗的 bug），測試會失敗。
 */
function phpUrlEncode(s: string): string {
  const bytes = Buffer.from(s, "utf8");
  let out = "";
  for (const b of bytes) {
    if (
      (b >= 0x41 && b <= 0x5a) || // A-Z
      (b >= 0x61 && b <= 0x7a) || // a-z
      (b >= 0x30 && b <= 0x39) || // 0-9
      b === 0x2d || // -
      b === 0x5f || // _
      b === 0x2e // .
    ) {
      out += String.fromCharCode(b);
    } else if (b === 0x20) {
      out += "+"; // 空白
    } else {
      out += "%" + b.toString(16).toUpperCase().padStart(2, "0");
    }
  }
  return out;
}

function refCheckMac(plaintext: string, hashKey: string, hashIV: string): string {
  let e = phpUrlEncode(hashKey + plaintext + hashIV).toLowerCase();
  // 綠界 .NET 相容：把這幾個換回字面（urlencode 後它們是 %xx）
  e = e
    .replace(/%2d/g, "-")
    .replace(/%5f/g, "_")
    .replace(/%2e/g, ".")
    .replace(/%21/g, "!")
    .replace(/%2a/g, "*")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")");
  return crypto.createHash("sha256").update(e).digest("hex").toUpperCase();
}

const KEY = "5294y06JbISpM5x9";
const IV = "v77hoKGq4kWxNNIS";

test("uriEscapeDataString 讓 ! * ( ) 維持字面（綠界 .NET 規則）", () => {
  assert.equal(uriEscapeDataString("!*()"), "!*()");
});

test("uriEscapeDataString 空白編成 + ，' 與 ~ 維持編碼", () => {
  assert.equal(uriEscapeDataString("a b"), "a+b");
  assert.equal(uriEscapeDataString("'"), "%27");
  assert.equal(uriEscapeDataString("~"), "%7E");
});

test("computeCheckMac 與獨立參考實作一致（留言含特殊符號）", () => {
  const plaintext = `{"RtnCode":1,"PatronName":"小明(測試)","PatronNote":"加油!! code:ABC123","TradeDate":"2024/01/01 12:00:00"}`;
  assert.equal(
    computeCheckMac(plaintext, KEY, IV),
    refCheckMac(plaintext, KEY, IV),
  );
});

test("computeCheckMac 與獨立參考實作一致（純文字）", () => {
  const plaintext = `{"RtnCode":1,"PatronName":"匿名","PatronNote":"純文字無特殊符號","TradeDate":"2024/01/01 12:00:00"}`;
  assert.equal(
    computeCheckMac(plaintext, KEY, IV),
    refCheckMac(plaintext, KEY, IV),
  );
});

test("回歸：含 ( ) ! 的留言不可再被誤編碼（防 CheckMacValue mismatch 再現）", () => {
  // 模擬「ECPay 端」用參考實作算出 CheckMacValue，驗證我方計算結果相符
  const plaintext = `{"RtnCode":1,"OrderInfo":{"TradeNo":"OP2024xyz","TradeAmt":150,"TradeStatus":"1"},"PatronNote":"(打賞) 主播加油！"}`;
  const platformMac = refCheckMac(plaintext, KEY, IV);
  const ourMac = computeCheckMac(plaintext, KEY, IV);
  assert.equal(ourMac, platformMac);
});
