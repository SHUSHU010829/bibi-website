# 逼逼機器人 — 抖內（贊助）系統開發規劃書（bibi-website）

> 本文件規劃把「綠界 / 歐付寶贊助（抖內）」的**執行流程**整段放在 bibi-website：Discord OAuth2 登入、建立付款 session、導向金流、接收與驗證 webhook、輪詢結果。
>
> **職責邊界**：website 負責「付款與身份」；**金錢 / 身分組 / DM / 公告等 Discord 端效果一律由 bibi-bot 執行**——website 在 webhook 驗證成功後，呼叫 bibi-bot 的內部 API `POST /api/donation/grant`。本文件「API 介接契約」章節與 `bibi-bot/docs/MINING_SYSTEM_PLAN.md` 逐字一致。
>
> 最後更新：2026-05-27

---

## 目錄

1. [背景與目標](#1-背景與目標)
2. [現況與前置需求](#2-現況與前置需求)
3. [整體架構](#3-整體架構)
4. [贊助方案與回饋](#4-贊助方案與回饋)
5. [完整付款流程](#5-完整付款流程)
6. [前端頁面](#6-前端頁面)
7. [API Routes](#7-api-routes)
8. [資料庫（共用 MongoDB）](#8-資料庫共用-mongodb)
9. [環境變數](#9-環境變數)
10. [金流平台後台設定](#10-金流平台後台設定)
11. [Webhook 可靠度與冪等](#11-webhook-可靠度與冪等)
12. [API 介接契約](#api-介接契約)
13. [開發時程](#13-開發時程)

---

## 1. 背景與目標

原企劃把抖內拆成「Vercel 中間頁面 + VPS Bot webhook」，金錢發放與 webhook 都壓在 bot。本次調整把**抖內執行整段搬到 bibi-website**：

- 玩家不需輸入任何代碼，透過 Discord OAuth2 確認身份後付款。
- website 擁有付款流程；bot 只保留一支發放 API。
- website 之後也會直接讀取共用 MongoDB（含未來 dashboard 資料），因此採**共用 bot 的 MongoDB Atlas**，而非另建資料庫。

---

## 2. 現況與前置需求

### 2.1 本站現況

- Next.js 16（App Router）+ fumadocs 文件站，部署於 Vercel。
- **目前是純靜態站**：無 backend、無 auth、無 DB、無 API route、無 `.env`。
- 既有公開文件在 `content/docs/*.mdx`、首頁 `src/app/page.tsx`。**抖內功能不可影響既有文件站**（新增 `app/donate/*` 與 `app/api/*`，不動 `content/`）。

### 2.2 要新增的技術棧

| 項目 | 用途 | 備註 |
|---|---|---|
| App Router route handlers | API 端點 | `src/app/api/**/route.ts` |
| `mongodb`（原生 driver） | 連共用 Atlas | 與 bot 同庫 `MorningBot`；serverless 連線需快取 client（見 §8.3） |
| Discord OAuth2 | 確認身份（scope `identify`） | 與既有 Dashboard OAuth App 共用，僅多一組 redirect URI |
| 綠界 / 歐付寶簽章 | `aes-128-cbc` 解密 + `CheckMacValue` 驗章 | 兩平台共用同一套程式，只換 HashKey / HashIV |

### 2.3 外部前置

- 申請綠界與歐付寶商家帳號（各 3–7 工作天，建議提早）。
- bibi-bot 端需先完成 `POST /api/donation/session` 與 `POST /api/donation/grant`（見 `bibi-bot/docs/MINING_SYSTEM_PLAN.md` Phase 8）。

> **本站 Next.js 為非標準版本（見 `AGENTS.md`）**：實作前請先讀 `node_modules/next/dist/docs/` 確認 route handler / runtime / OAuth 寫法，以下程式碼僅為示意。

---

## 3. 整體架構

```
┌────────────────────┐  OAuth2(identify)  ┌────────────────┐
│  Browser           │ ─────────────────▶ │ Discord OAuth  │
│  donate.*（Next.js）│                    └────────────────┘
└─────────┬──────────┘
          │ 1. 建立 session / 2. 導向金流 / 3. 輪詢狀態
          ▼
┌─────────────────────────────────────────────┐  唯讀   ┌────────────────────┐
│  bibi-website（Next.js, Vercel）             │ ─────▶ │  共用 MongoDB Atlas │
│  app/donate/*  app/api/donation/*           │ (status │  donation_sessions  │
│  ├─ create（呼叫 bot session API）/ status  │  輪詢)  │  donation_records   │
│  └─ ecpay/webhook  opay/webhook             │        │  unmatched_donations│
└─────────┬───────────────────────────────────┘        └─────────▲──────────┘
          │ 建立 session：POST /api/donation/session（Bearer）       │ 所有寫入
          │ 發放：       POST /api/donation/grant（Bearer）          │ 只由 bot
          ▼                                                        │
┌─────────────────────────────────────────────┐                   │
│  bibi-bot（discord.js + Express, VPS）       │ ──────────────────┘
│  建立/完成 session、發金幣/身分組/DM/公告    │
│  寫 donation_sessions / records / unmatched  │
└─────────────────────────────────────────────┘
                  ▲
   綠界 / 歐付寶 ──┘ Server-to-Server 付款通知（ReturnURL → website webhook）
```

**安全模型（安全強化版）**：website 對共用 MongoDB 只持有**唯讀**帳號，只用來輪詢 session 狀態與顯示紀錄；**所有寫入一律經由 bot 的兩支 API**。建立 session（`POST /api/donation/session`）與發放（`POST /api/donation/grant`）都走 bot，連 `unmatched_donations` 也由 bot 在找不到 session 時寫入。如此 website 即使被攻破，也無法直接竄改 DB 或重複發幣。webhook 所需的金流 HashKey / HashIV 仍在 website（驗章 / 解密 / 表單簽章）。

---

## 4. 贊助方案與回饋

| 方案 | 金額 | 金幣 | 消耗品 | 身分組 | 限定外觀 | 特殊 |
|---|---|---|---|---|---|---|
| ☕ 小額支持 | NT$50–149 | 500 | 幸運藥水 ×3 | 贊助者（7 天） | — | — |
| 🎮 一般贊助 | NT$150–499 | 2,000 | CD 縮短券 ×5 | 贊助者（30 天） | — | 挖礦 luck +5%（30 天） |
| 💎 大額贊助 | NT$500–999 | 6,000 | — | 贊助者（90 天） | 限定卡面（永久） | 自訂稱號 30 天 + luck +8%（90 天） |
| 👑 頂級贊助 | NT$1,000+ | 15,000 | — | 頂級贊助者（**永久**） | 限定卡面（永久） | 自訂稱號 90 天 + luck +12%（永久）+ 可提名限定稱號 |

> 方案數值的**權威定義在 bot 的 `src/config/donation_tiers.json`**。website 只用於前端顯示，實際發放以 bot 為準（避免兩邊數值飄移）。`amountNtd` 對應哪個方案由 bot 判定。

---

## 5. 完整付款流程

```
1. 玩家進入 /donate
2. 點「Discord 登入」→ OAuth2 scope: identify → 取得 userId + username + avatar
3. /donate/confirm 顯示「你好，SHUSHU！」確認身份
4. 選贊助金額與平台（綠界 / 歐付寶）
5. 前端 POST /api/donation/create
   → 後端轉呼叫 bot POST /api/donation/session（Bearer）
   → bot 建立 donation_sessions（pending，TTL 30 分）並回 { sessionId, merchantTradeNo }
   → website 用 merchantTradeNo + 自有 HashKey/IV 組金流表單參數（含 CheckMacValue）
6. 前端把參數 POST 到金流收款頁（信用卡）
7. 玩家刷卡完成
8. 金流 Server-to-Server POST → /api/donation/{ecpay|opay}/webhook
9. webhook：驗 CheckMacValue → 解密 Data → 檢查 RtnCode===1 且非 SimulatePaid
   → 呼叫 bot POST /api/donation/grant（Bearer，帶 merchantTradeNo + tradeNo + amountNtd）
   → bot 由 session 還原 userId、冪等發放、寫 donation_records、翻 session=completed；
     找不到 session 則由 bot 寫 unmatched_donations
   → 回 '1|OK' 給金流（非成功一律回 '1|OK' 以停止重送，驗章失敗才回 '0|Error'）
10. /donate/success 輪詢 GET /api/donation/status/:sessionId（每 2 秒，最多 30 秒）
    → 後端以唯讀 DB 讀 donation_sessions.status；'completed' → 顯示成功畫面 + 權益清單
11. bot DM 玩家收據 + 指定頻道公告（由 grantDonationPerks 觸發）
```

**為什麼用 `MerchantTradeNo` 而非留言欄**：`MerchantTradeNo` 是特店自產的交易編號，webhook 一定帶回，可精確對應 session，玩家完全不需輸入任何東西。`merchantTradeNo` 由 **bot 的 session API** 產生（`DON` + sessionId 去 `-` 前 17 碼，≤ 20）並回傳給 website；website webhook 收到後原樣帶給 bot 的 grant API 對應 session。

---

## 6. 前端頁面

```
src/app/donate/
├─ page.tsx            # 選方案 + Discord 登入入口
├─ confirm/page.tsx    # 確認身份 + 選金額 / 平台 + 導向付款
└─ success/page.tsx    # 付款後 polling + 顯示成功畫面
```

- 樣式：本站 Tailwind 4 已設定但未匯入（避免與 fumadocs-ui 衝突）。`/donate/*` 為獨立 route group，可在其 layout 內自行匯入 Tailwind 或用既有 `globals.css` 設計 token，**不要影響 `/docs` 既有樣式**。
- `/donate/success` 為 client component，用 `useEffect` 輪詢 `/api/donation/status/:id`。

---

## 7. API Routes

```
src/app/api/
├─ auth/discord/[...discord]/route.ts   # Discord OAuth2 login + callback（scope identify）
└─ donation/
   ├─ create/route.ts                   # 轉呼叫 bot /api/donation/session 建立 pending，回金流參數
   ├─ status/[id]/route.ts              # 輪詢 session 狀態（唯讀 DB）
   ├─ ecpay/webhook/route.ts            # 綠界付款通知
   └─ opay/webhook/route.ts             # 歐付寶付款通知
```

每個 webhook route 必須宣告為動態、不可被靜態化：

```ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";   // 需要 node crypto 解密，不能用 edge
export const maxDuration = 30;
```

### Webhook 共用核心（綠界 / 歐付寶只換 HashKey / HashIV）

```ts
// src/lib/donation/webhookHandler.ts
import crypto from "node:crypto";

function decryptData(encrypted: string, hashKey: string, hashIV: string) {
  const decoded = Buffer.from(decodeURIComponent(encrypted), "base64");
  const decipher = crypto.createDecipheriv("aes-128-cbc", Buffer.from(hashKey, "utf8"), Buffer.from(hashIV, "utf8"));
  decipher.setAutoPadding(true);
  return JSON.parse(decipher.update(decoded) + decipher.final("utf8"));
}

export async function handleDonationWebhook(req: Request, platform: "ecpay" | "opay") {
  const cfg = getPlatformConfig(platform);             // { hashKey, hashIV }
  const body = await parseForm(req);
  if (!verifyCheckMac(body, cfg.hashKey, cfg.hashIV)) return "0|Error";   // 驗章失敗才回錯
  const data = decryptData(body.Data, cfg.hashKey, cfg.hashIV);
  if (data.RtnCode !== 1) return "1|OK";               // 非成功交易，停止重送
  if (data.SimulatePaid === 1) return "1|OK";          // 模擬付款不發放

  // website 不寫 DB：直接把驗證過的資料交給 bot。bot 負責對應 session、發放、
  // 寫 records / 翻 session / 找不到時寫 unmatched_donations。冪等在 bot（trade_no）。
  const r = await fetch(`${process.env.BOT_API_BASE_URL}/api/donation/grant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DONATION_GRANT_SECRET}` },
    body: JSON.stringify({
      merchantTradeNo: data.MerchantTradeNo, tradeNo: data.TradeNo,
      amountNtd: data.TradeAmt, platform,
    }),
  });
  if (!r.ok) return "0|Error";                          // bot 暫時不可用 → 回錯讓金流重送
  return "1|OK";
}
```

> 不傳 `tierId` / `userId`：方案由 bot 依 `amountNtd` 對 `donation_tiers.json` 判定，`userId` 由 bot 從 session 還原——數值與身分都單一權威來源在 bot。

---

## 8. 資料庫（共用 MongoDB）

### 8.1 website 對 DB 只有唯讀（安全強化版）

所有 collection 都由 **bot 寫入**；website 只用唯讀帳號讀取：

```js
// donation_sessions — bot 的 session API 建立 pending、grant API 翻 completed
{ session_id, merchant_trade_no /* unique */, user_id, guild_id, amount_ntd, platform, status, created_at }
// TTL 30 分（pending 自動過期）

// donation_records — bot 的 grant API 寫（永久），成功頁可用 merchant_trade_no 反查作備援判定
{ user_id, guild_id, amount_ntd, tier_id, platform, trade_no /* unique */, granted_at, perks }

// unmatched_donations — bot 在 grant 找不到 session 時寫（人工 / 對帳補發）
{ platform, data, ts, resolved }
```

- 輪詢用：讀 `donation_sessions.status`（或以 `merchant_trade_no` 反查 `donation_records` 作備援）。
- 未來 dashboard：唯讀 `UserCoins`、`CoinTransactions` 等既有經濟資料。
- **Atlas 建議建一個只讀角色（`read` on `MorningBot`）給 website 用**，與 bot 的讀寫帳號分離。

### 8.2 serverless 連線注意

```ts
// src/lib/mongo.ts — 在 serverless 必須快取 MongoClient（唯讀連線），避免每次請求重連耗盡連線數
let cached: Promise<MongoClient> | null = (globalThis as any)._mongo ?? null;
export function getClient() {
  if (!cached) cached = new MongoClient(process.env.MONGODB_URI_READONLY!).connect();
  (globalThis as any)._mongo = cached;
  return cached;
}
```

---

## 9. 環境變數

於 Vercel 專案設定（新增 `.env.example`）：

```
MONGODB_URI_READONLY=        # 共用 bot 的 MongoDB Atlas，建議用唯讀角色（read on MorningBot）
PRIMARY_GUILD_ID=1174352637295067157
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=        # https://<website>/api/auth/discord/callback
ECPAY_MERCHANT_ID=
ECPAY_HASH_KEY=
ECPAY_HASH_IV=
OPAY_MERCHANT_ID=
OPAY_HASH_KEY=
OPAY_HASH_IV=
BOT_API_BASE_URL=            # bot Express 對外位址，例 https://bot.shushu.tw
DONATION_GRANT_SECRET=       # 與 bot 端同值，呼叫 session / grant API 用
```

> `DONATION_GRANT_SECRET` 必須與 bibi-bot `.env` 的同名變數一致。`MONGODB_URI_READONLY` 用唯讀角色，與 bot 的讀寫帳號分離。

---

## 10. 金流平台後台設定（一次性）

| 欄位 | 綠界 | 歐付寶 |
|---|---|---|
| ReturnURL（Server 通知） | `https://<website>/api/donation/ecpay/webhook` | `https://<website>/api/donation/opay/webhook` |
| ClientRedirectURL（導回頁面） | `https://<website>/donate/success` | `https://<website>/donate/success` |
| 收款方式 | 僅信用卡 | 僅信用卡 |
| 金額 | 由贊助者自填 | 由贊助者自填 |

---

## 11. Webhook 可靠度與冪等

原企劃擔心 Vercel serverless 冷啟動漏接付款通知。本設計用四層防護處理：

1. **金流平台重送**：未收到 `1|OK` 會自動重送，webhook route 設 `force-dynamic` + `runtime=nodejs` + 適當 `maxDuration`，降低冷啟動漏接。
2. **冪等**：bot 端以 `donation_records.trade_no` unique 防重複發放，重送安全。
3. **unmatched 暫存**：bot 的 grant API 找不到 session 時寫 `unmatched_donations`；若 bot 暫時不可用，website webhook 回 `0|Error` 讓金流稍後重送。
4. **bot 對帳 cron + 手動補發**：bot 端 `donationReconcile` 掃逾時 pending / 查金流 API；管理員可用 `/donation-admin grant` 補發。

> 若日後對可靠度要求更高，可把 webhook route 改部署到常駐環境（VPS / 長運行 Node），其餘前端維持 Vercel。

---

## API 介接契約

> **本章節與 `bibi-bot/docs/MINING_SYSTEM_PLAN.md` 的「API 介接契約」逐字一致。任一邊修改都要同步。**

### 安全模型

website 對共用 MongoDB 只持有**唯讀**帳號；所有寫入一律經由 bot 的兩支 API。webhook 所需的金流 HashKey / HashIV 仍在 website（驗章 / 解密 / 表單簽章用）。兩支 API 皆用 `Authorization: Bearer <DONATION_GRANT_SECRET>`。

### 跨服務呼叫 1：建立 session（website → bot）

**`POST {BOT_API_BASE_URL}/api/donation/session`**

- Request body：

```json
{ "userId": "Discord 使用者 ID", "guildId": "主 guild ID", "amountNtd": 500, "platform": "ecpay" }
```

- Response 200：

```json
{ "ok": true, "sessionId": "uuid", "merchantTradeNo": "DON..." }
```

- 行為：bot 產生 `sessionId` 與 `merchantTradeNo`（`DON` + sessionId 去 `-` 前 17 碼），寫 `donation_sessions`（pending，TTL 30 分），回傳給 website 組金流表單。

### 跨服務呼叫 2：發放（website → bot）

**`POST {BOT_API_BASE_URL}/api/donation/grant`**

- Request body（`userId` / `guildId` 由 bot 從 session 還原，不由 webhook 帶入 → 防偽造身分）：

```json
{ "merchantTradeNo": "DON...", "tradeNo": "平台交易編號（冪等鍵）", "amountNtd": 500, "platform": "ecpay" }
```

- Response 200：

```json
{ "ok": true, "matched": true, "alreadyGranted": false,
  "perks": { "coins": 6000, "roleId": "...", "items": {"cd_ticket":0}, "luck": 0.08, "theme": "theme_donor", "title": "custom_30d" } }
```

- 行為：
  - 以 `tradeNo` 查 `donation_records` 做**冪等**——已存在則回 `alreadyGranted:true` 不重複發放。
  - 以 `merchantTradeNo` 找 pending `donation_sessions` 取 `userId` / `guildId`；**找不到 → bot 自行寫 `unmatched_donations`，回 `{ ok:true, matched:false }`**（website 不需也不能寫 DB）。
  - 找到 → 依 `amountNtd` 對 `donation_tiers.json` 判定方案發放，**在同一筆動作**寫 `donation_records` 並把 `donation_sessions.status` 翻為 `completed`。
- 錯誤碼：`401` Bearer 不符、`400` 參數錯誤、`503` bot 未就緒或 DB 未掛載（website 收到非 2xx 應記錄並重試）。

### 共用 MongoDB collection 擁有權

| collection | 寫入方 | 讀取方 | 備註 |
|---|---|---|---|
| `donation_sessions` | bot（session API 建立 pending、grant API 翻 completed） | bot / website（唯讀輪詢） | `{ session_id, merchant_trade_no(unique), user_id, guild_id, amount_ntd, platform, status('pending'\|'completed'\|'expired'), created_at }`，pending TTL 30 分 |
| `donation_records` | bot（grant API） | bot / website（唯讀） | `{ user_id, guild_id, amount_ntd, tier_id, platform, trade_no(unique), granted_at, perks }`，永久 |
| `unmatched_donations` | bot（grant API 找不到 session 時） | bot 管理指令 | `{ platform, data, ts, resolved }` |
| `UserCoins` / `CoinTransactions` | bot | bot / website（唯讀） | 既有經濟資料 |

### 抖內 buff 與 Twitch 訂閱疊加規則

- 挖礦 luck：抖內 + Twitch 相加後受 `luckCap = 25%` 全域限制。
- 身分組：贊助身分組與 Twitch 訂閱身分組可同時持有，效果獨立。
- 限定卡面：兩管道 id 不同，可各自解鎖。
- 永久頂級贊助者身分組不因 Twitch 訂閱取消而受影響。

---

## 13. 開發時程

| 步驟 | 內容 | 預估 |
|---|---|---|
| W0 | 申請綠界 / 歐付寶商家帳號（並行等待） | 3–7 工作天 |
| W1 | 引入 mongodb driver + Discord OAuth2 + `/donate` 三頁骨架 | 1–2 天 |
| W2 | `create`（轉呼叫 bot session API）/ `status`（唯讀輪詢） | 1–2 天 |
| W3 | 綠界 / 歐付寶 webhook（驗章 / 解密 / 呼叫 bot grant） | 2 天 |
| W4 | 成功頁備援判定、可靠度測試（含模擬付款、bot 不可用重送） | 1 天 |
| **合計** | （不含商家帳號等待） | **5–7 天** |

> 前置：bibi-bot 端 `POST /api/donation/session`、`POST /api/donation/grant`、`donation_tiers.json`、`donation_sessions` / `donation_records` / `unmatched_donations` collection 需先完成（見 `bibi-bot/docs/MINING_SYSTEM_PLAN.md` Phase 8）。Atlas 需另開一個唯讀角色給 website。

_Last updated: 2026-05-27_
