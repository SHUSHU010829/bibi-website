# 逼逼機器人 — 抖內（贊助）系統開發規劃書（bibi-website）

> **2026-05-28 重大架構調整**：放棄申請商家帳號自跑金流，改用**綠界 / 歐付寶實況主收款**現成 hosted 收款頁。
>
> 本文件規劃 Discord OAuth2 登入 → 在 bibi-website 產生短代碼 → 導向實況主收款頁 → 解析 webhook 對應 session → 呼叫 bot 發放回饋。
>
> **職責邊界**：website 負責「身份 + 短碼 + 解析 webhook」；**金錢 / 身分組 / DM / 公告等 Discord 端效果一律由 bibi-bot 執行**——website 在 webhook 驗證成功後，呼叫 bibi-bot 的內部 API `POST /api/donation/grant`。本文件「API 介接契約」章節與 `bibi-bot/docs/MINING_SYSTEM_PLAN.md` 逐字一致。
>
> 最後更新：2026-05-28

---

## 目錄

1. [背景與目標](#1-背景與目標)
2. [為什麼從商家版改為實況主版](#2-為什麼從商家版改為實況主版)
3. [現況與前置需求](#3-現況與前置需求)
4. [整體架構](#4-整體架構)
5. [贊助方案與回饋](#5-贊助方案與回饋)
6. [完整付款流程](#6-完整付款流程)
7. [前端頁面](#7-前端頁面)
8. [API Routes](#8-api-routes)
9. [資料庫（共用 MongoDB）](#9-資料庫共用-mongodb)
10. [環境變數](#10-環境變數)
11. [兩家平台後台設定](#11-兩家平台後台設定)
12. [Webhook 可靠度與冪等](#12-webhook-可靠度與冪等)
13. [API 介接契約](#api-介接契約)
14. [開發時程](#14-開發時程)

---

## 1. 背景與目標

- 玩家透過 Discord OAuth2 確認身份後付款。
- website 擁有付款入口與 webhook 解析；bot 只保留一支發放 API。
- website 之後也會直接讀取共用 MongoDB（含未來 dashboard 資料），因此採**共用 bot 的 MongoDB Atlas**，而非另建資料庫。

---

## 2. 為什麼從商家版改為實況主版

| 面向 | 商家帳號（舊規劃） | 實況主收款（現規劃） |
|---|---|---|
| 申請門檻 | 需公司行號 / 公會 / 個人帳戶，審 3–7 工作天 | 個人帳號秒開 |
| 收款頁 | 自建在 bibi-website | ECPay / OPay hosted 頁面 |
| MerchantTradeNo | 我們自產，可直接對應 session | 平台自產，**對應改用「贊助者留言」欄塞短碼** |
| HashKey / HashIV | 商家後台取得 | 同一個廠商後台取得，**演算法完全相同**，沿用 |
| webhook payload | 商家版 V2 表單 | 實況主 V3 JSON（多了 `RpHeader`、`PatronName`、`PatronNote`、`LivestreamURL`） |
| 抽成 | 較低（信用卡 2.x%） | 略高（信用卡 ~2.75%，TWQR 2.45%） |

關鍵差別：**MerchantTradeNo 不再是 session 對應鍵**。我們改在 `PatronNote`（贊助者留言）內塞一組 6 碼短碼，例如 `DON-AB12CD`，donor 在實況主收款頁的「留言」欄手動輸入這組碼。webhook 收到後從 `PatronNote` 正規抽出碼，再對 `donation_sessions` 查。

---

## 3. 現況與前置需求

### 3.1 本站現況

- Next.js 16（App Router）+ fumadocs 文件站，部署於 Zeabur。
- 已完成 W1：Discord OAuth2 + `/donate` 三頁骨架（PR #14）。
- 既有公開文件在 `content/docs/*.mdx`、首頁 `src/app/page.tsx`。

### 3.2 要新增的技術棧

| 項目 | 用途 | 備註 |
|---|---|---|
| App Router route handlers | API 端點 | `src/app/api/**/route.ts` |
| `mongodb`（原生 driver） | 連共用 Atlas | 與 bot 同庫 `MorningBot`；serverless 連線需快取 client |
| Discord OAuth2 | ✅ 已完成 | scope `identify` |
| `aes-128-cbc` + `CheckMacValue` | 解 webhook 加密 Data + 驗章 | 兩平台共用同一套，差別只在 HashKey/IV |

### 3.3 外部前置

- 申請綠界 / 歐付寶**實況主收款**功能（個人帳號即可，免商家審核）。
  - 綠界 ECPay：付款 URL `https://payment.ecpay.com.tw/Broadcaster/Donate/{id}`
  - 歐付寶 OPay：付款 URL `https://payment.opay.tw/Broadcaster/Donate/{id}`
- 從廠商後台抓 `HashKey` / `HashIV`（**敏感資訊，只填到 Zeabur 環境變數**）。
- bibi-bot 端需先完成 `POST /api/donation/session` 與 `POST /api/donation/grant`（見 `bibi-bot/docs/MINING_SYSTEM_PLAN.md` Phase 8）。

---

## 4. 整體架構

```
┌────────────────────┐  OAuth2(identify)  ┌────────────────┐
│  Browser           │ ─────────────────▶ │ Discord OAuth  │
│  bibi-website      │                    └────────────────┘
└─────────┬──────────┘
          │ 1. /donate/confirm 選方案 + 金額 + 平台
          │ 2. POST /api/donation/create → 取得短碼 + 收款頁 URL
          │ 3. 跳到 ECPay/OPay 實況主收款頁（新分頁）
          ▼
┌─────────────────────────────────────────────┐  唯讀   ┌────────────────────┐
│  bibi-website（Next.js, Zeabur）            │ ─────▶ │  共用 MongoDB Atlas │
│  app/donate/*  app/api/donation/*           │ (狀態  │  donation_sessions  │
│  ├─ create（呼叫 bot session API）/ status │  輪詢)  │  donation_records   │
│  └─ ecpay/webhook  opay/webhook             │        │  unmatched_donations│
└─────────┬───────────────────────────────────┘        └─────────▲──────────┘
          │ 建立 session：POST /api/donation/session（Bearer）       │ 所有寫入
          │ 發放：       POST /api/donation/grant（Bearer）          │ 只由 bot
          ▼                                                        │
┌─────────────────────────────────────────────┐                   │
│  bibi-bot（discord.js + Express, VPS）       │ ──────────────────┘
│  建立/完成 session（含產生短碼）            │
│  發金幣/身分組/DM/公告                     │
└─────────────────────────────────────────────┘
                  ▲
       ECPay/OPay ┘ Server-to-Server 通知（ReturnURL → website webhook）
```

**安全模型**：website 對共用 MongoDB 只持有**唯讀**帳號；所有寫入一律經由 bot 的兩支 API。webhook 所需的 HashKey / HashIV 仍在 website（解 Data + 驗 CheckMacValue 用）。

---

## 5. 贊助方案與回饋

| 方案 | 金額 | 金幣 | 消耗品 | 身分組 | 限定外觀 | 特殊 |
|---|---|---|---|---|---|---|
| ☕ 小額支持 | NT$50–149 | 500 | 幸運藥水 ×3 | 贊助者（7 天） | — | — |
| 🎮 一般贊助 | NT$150–499 | 2,000 | CD 縮短券 ×5 | 贊助者（30 天） | — | 挖礦 luck +5%（30 天） |
| 💎 大額贊助 | NT$500–999 | 6,000 | — | 贊助者（90 天） | 限定卡面（永久） | 自訂稱號 30 天 + luck +8%（90 天） |
| 👑 頂級贊助 | NT$1,000+ | 15,000 | — | 頂級贊助者（**永久**） | 限定卡面（永久） | 自訂稱號 90 天 + luck +12%（永久）+ 可提名限定稱號 |

> 方案數值的**權威定義在 bot 的 `src/config/donation_tiers.json`**。website 只用於前端顯示，實際發放以 bot 為準（避免兩邊數值飄移）。`amountNtd` 對應哪個方案由 bot 判定。
>
> NT$10–49 仍能在實況主收款頁付款，但**未達門檻不發回饋**（bot 寫進 `unmatched_donations` 或 `donation_records` 中標 `tierId=null`）。

---

## 6. 完整付款流程

```
1. 玩家進入 /donate
2. 點「Discord 登入」→ OAuth2 scope: identify → 取得 userId + username + avatar
3. /donate/confirm 顯示「你好，SHUSHU！」確認身份
4. 選贊助金額與平台（綠界 / 歐付寶）
5. 前端 POST /api/donation/create
   → 後端轉呼叫 bot POST /api/donation/session（Bearer）
   → bot 建立 donation_sessions（pending，TTL 30 分）並回 { sessionId, code: "DON-AB12CD" }
   → website 回傳 { sessionId, code, paymentUrl }
6. 前端顯示：
   - 大字顯示 code（含「複製」按鈕）
   - 提示：「請在綠界/歐付寶的『贊助者留言』欄輸入 DON-AB12CD」
   - 「開啟付款頁」按鈕 → 新分頁開 paymentUrl，本分頁導向 /donate/success
7. 玩家在實況主收款頁輸入：金額 / 贊助者名稱 / 留言（含我們的 code） / 付款方式 → 刷卡
8. ECPay/OPay Server-to-Server POST → /api/donation/{ecpay|opay}/webhook
9. webhook：解 base64 → AES-128-CBC 解密 Data → 驗 CheckMacValue → 檢查 RtnCode===1
   → 從 PatronNote 正規抽出 code（找不到也照樣呼叫 bot grant，由 bot 寫 unmatched_donations）
   → 呼叫 bot POST /api/donation/grant（Bearer，帶 code + tradeNo + amountNtd + platform + patronName + patronNote）
   → bot 由 code 還原 session.userId、冪等發放、寫 donation_records、翻 session=completed
   → 回 '1|OK' 給平台
10. /donate/success 輪詢 GET /api/donation/status/:sessionId（每 2 秒，最多 30 秒）
    → 後端以唯讀 DB 讀 donation_sessions.status；'completed' → 顯示成功畫面 + 權益清單
11. bot DM 玩家收據 + 指定頻道公告（由 grantDonationPerks 觸發）
```

**為什麼用 `PatronNote` + 短碼，而不用 `MerchantTradeNo`**：實況主版本的 `MerchantTradeNo` 由平台自動產生，特店無法控制。改用 donor 自行輸入的「贊助者留言」當對應鍵；短碼設計成 6 字元 Crockford-ish base32（去掉 0/1/I/L/O 避免認錯）+ `DON-` 前綴，目視易讀、不易打錯。

**短碼格式**：`DON-XXXXXX`，其中 X ∈ `23456789ABCDEFGHJKMNPQRSTUVWXYZ`（31 字元）。約 30 bits entropy ≈ 8.8 億組合，30 分鐘 TTL 下足以避免碰撞。

---

## 7. 前端頁面

```
src/app/donate/
├─ page.tsx                       # 方案總覽 + Discord 登入入口
├─ confirm/
│  ├─ page.tsx                    # 確認身份（server）
│  └─ confirm-form.tsx            # 選金額 / 平台 / 取碼 / 開付款頁（client）
└─ success/
   ├─ page.tsx
   └─ success-poller.tsx          # 輪詢 status，pending 時持續顯示 code 提醒
```

- 樣式 scope 在 `.donate-root`，不影響 `/docs` fumadocs。
- `/donate/success` 為 client component，用 `useEffect` 輪詢 `/api/donation/status/:id`。

### 7.1 /donate/confirm 兩段流程

```
[Step 1] 選 tier / 金額 / 平台 → 按「取得付款代碼」
   ↓ POST /api/donation/create
[Step 2] 顯示 code（大字 + 複製鈕）+ 收款頁外連按鈕
         → 點「開啟付款頁」：新分頁開 paymentUrl，本分頁 push /donate/success?sessionId=X
```

---

## 8. API Routes

```
src/app/api/
├─ auth/discord/[...discord]/route.ts   # ✅ Discord OAuth2 login + callback
└─ donation/
   ├─ create/route.ts                   # 轉呼叫 bot /api/donation/session，回 code + paymentUrl
   ├─ status/[id]/route.ts              # 輪詢 session 狀態（唯讀 DB）
   ├─ ecpay/webhook/route.ts            # 綠界實況主付款通知
   └─ opay/webhook/route.ts             # 歐付寶實況主付款通知
```

每個 webhook route 必須宣告為動態、不可被靜態化：

```ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";   // 需要 node crypto 解密
export const maxDuration = 30;
```

### 8.1 Webhook 共用核心（綠界 / 歐付寶只換 HashKey / HashIV）

```ts
// src/lib/donation/ecpayCrypto.ts
import crypto from "node:crypto";

// .NET HttpUtility.UrlEncode 風格（小寫 hex、'~' 編碼為 %7e）
function dotnetUrlEncode(s: string): string {
  return encodeURIComponent(s)
    .replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase())
    .replace(/'/g, "%27")
    .replace(/~/g, "%7e");
}

export function computeCheckMac(
  params: Record<string, string | number>,
  hashKey: string,
  hashIV: string,
): string {
  const keys = Object.keys(params)
    .filter((k) => k !== "CheckMacValue")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const body = keys.map((k) => `${k}=${params[k]}`).join("&");
  const raw = `HashKey=${hashKey}&${body}&HashIV=${hashIV}`;
  return crypto
    .createHash("sha256")
    .update(dotnetUrlEncode(raw).toLowerCase())
    .digest("hex")
    .toUpperCase();
}

// AES-128-CBC + PKCS7，先 base64 decode → AES decrypt → URL decode → JSON parse
export function decryptData(encrypted: string, hashKey: string, hashIV: string): unknown {
  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    Buffer.from(hashKey, "utf8"),
    Buffer.from(hashIV, "utf8"),
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decodeURIComponent(decrypted.toString("utf8")));
}
```

```ts
// src/lib/donation/webhookHandler.ts （pseudo-code）
export async function handleBroadcasterWebhook(req: Request, platform: "ecpay" | "opay") {
  const cfg = getPlatformConfig(platform);          // { hashKey, hashIV, merchantId }
  const body = await req.json();
  // CheckMacValue 驗證（DONATION_WEBHOOK_ALLOW_INSECURE=1 時可暫時跳過供初次串接）
  // → 解 Data → 檢查 RtnCode===1, SimulatePaid !== 1, TradeStatus === "1"
  // → 從 PatronNote 正規抽出 code
  // → 呼叫 bot grant，把 code/tradeNo/amount/patronName/patronNote 都帶過去
  // → 回 '1|OK'（驗章失敗或 bot 暫時不可用時回 '0|Error' 讓平台重送）
}
```

> 不傳 `tierId` / `userId`：方案由 bot 依 `amountNtd` 對 `donation_tiers.json` 判定，`userId` 由 bot 從 session 還原（code → session.userId）——數值與身分都單一權威來源在 bot。

---

## 9. 資料庫（共用 MongoDB）

### 9.1 website 對 DB 只有唯讀

所有 collection 都由 **bot 寫入**；website 只用唯讀帳號讀取：

```js
// donation_sessions — bot 的 session API 建立 pending、grant API 翻 completed
{ session_id, code /* unique, e.g. "DON-AB12CD" */, user_id, guild_id, amount_ntd, platform, status, created_at }
// TTL 30 分（pending 自動過期）

// donation_records — bot 的 grant API 寫（永久），成功頁可用 code 反查作備援判定
{ user_id, guild_id, amount_ntd, tier_id, platform, trade_no /* unique */, granted_at, perks, patron_name, patron_note }

// unmatched_donations — bot 在 grant 找不到 code 對應 session 時寫
{ platform, trade_no, amount_ntd, patron_name, patron_note, code_attempt, ts, resolved }
```

- 輪詢用：讀 `donation_sessions.status`（或以 `code` 反查 `donation_records` 作備援）。
- 未來 dashboard：唯讀 `UserCoins`、`CoinTransactions` 等既有經濟資料。
- **Atlas 建議建一個只讀角色（`read` on `MorningBot`）給 website 用**，與 bot 的讀寫帳號分離。

### 9.2 serverless 連線注意

```ts
// src/lib/mongo.ts — serverless 必須快取 MongoClient
let cached: Promise<MongoClient> | null = (globalThis as any)._mongo ?? null;
export function getClient() {
  if (!cached) cached = new MongoClient(process.env.MONGODB_URI_READONLY!).connect();
  (globalThis as any)._mongo = cached;
  return cached;
}
```

---

## 10. 環境變數

於 Zeabur 專案設定（同步維護 `.env.example`）：

```
# --- Discord OAuth2（W1 已完成） ---
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=        # https://<website>/api/auth/discord/callback
DISCORD_SESSION_SECRET=      # openssl rand -hex 32
PRIMARY_GUILD_ID=1174352637295067157

# --- bot 介接 ---
BOT_API_BASE_URL=            # 例 https://bot.shushu.tw
DONATION_GRANT_SECRET=       # 與 bot 端同值

# --- 共用 MongoDB（唯讀） ---
MONGODB_URI_READONLY=        # Atlas 上只讀 MorningBot 的角色

# --- 實況主收款設定 ---
# BROADCASTER_ID = 實況主收款 URL 後面那串 hex（用來組導向付款的 URL）
# MERCHANT_ID    = 特店編號 / 會員編號（廠商後台首頁的數字 ID；webhook MerchantID 比對）
ECPAY_BROADCASTER_ID=DB653B5A8412C200A0997E7DDDCFF539
ECPAY_MERCHANT_ID=
OPAY_BROADCASTER_ID=37AAD58C9C2DF7993500AB06A67A8F57
OPAY_MERCHANT_ID=

# --- HashKey / HashIV（廠商後台 → 系統介接設定） ---
ECPAY_HASH_KEY=
ECPAY_HASH_IV=
OPAY_HASH_KEY=
OPAY_HASH_IV=

# --- 開發 / 測試用（正式環境務必為 0 或不設） ---
DONATION_WEBHOOK_ALLOW_INSECURE=0   # 1 時跳過 CheckMacValue 驗證
```

> `DONATION_GRANT_SECRET` 必須與 bibi-bot `.env` 的同名變數一致。`MONGODB_URI_READONLY` 用唯讀角色，與 bot 的讀寫帳號分離。

---

## 11. 兩家平台後台設定（一次性）

### 11.1 綠界 ECPay 實況主後台

- 「**付款完成通知回傳網址**」→ `https://bibi-website.zeabur.app/api/donation/ecpay/webhook`
- 「**直播頻道網址**」→（選填）`https://www.twitch.tv/shushu010829`
- 「**最低贊助金額**」→ 10 元
- 「**是否開立發票/收據**」→ 否
- 收款方式：信用卡（最少）

### 11.2 歐付寶 OPay 實況主後台

- 「**贊助付款成功通知網址**」→ `https://bibi-website.zeabur.app/api/donation/opay/webhook`
- 其餘同上

### 11.3 HashKey / HashIV 取得

兩家都在 **廠商管理後台 → 系統開發管理 → 系統介接設定** 取得（與商家版同一組金鑰）。**敏感資訊只填到 Zeabur 環境變數**，**不要 commit 進 git**。

---

## 12. Webhook 可靠度與冪等

1. **平台重送**：未收到 `1|OK` 會自動重送。OPay 為每 5–15 分鐘一次、當天最多 4 次；ECPay 行為類似。
2. **冪等**：bot 端以 `donation_records.trade_no` unique 防重複發放，重送安全。
3. **找不到 code → unmatched**：bot 的 grant API 找不到對應 session 時寫 `unmatched_donations`；若 bot 暫時不可用，website webhook 回 `0|Error` 讓平台稍後重送。
4. **bot 對帳 cron + 手動補發**：bot 端 `donationReconcile` 掃逾時 pending；管理員可用 `/donation-admin grant <trade_no> <discord_id>` 補發。
5. **SimulatePaid 標記**：模擬付款不會撥款給特店，**也不可發放回饋**。webhook 看到 `SimulatePaid === 1` 直接回 `1|OK` 跳過。

> 若日後對可靠度要求更高，可把 webhook route 改部署到常駐環境（VPS / 長運行 Node），其餘前端維持 Zeabur。

---

## API 介接契約

> **本章節與 `bibi-bot/docs/MINING_SYSTEM_PLAN.md` 的「API 介接契約」逐字一致。任一邊修改都要同步。**
>
> **2026-05-28 變更**：對應鍵從 `merchantTradeNo` 改為 `code`（DON-XXXXXX 短碼）。bot 端 Phase 8 規格需同步更新。

### 安全模型

website 對共用 MongoDB 只持有**唯讀**帳號；所有寫入一律經由 bot 的兩支 API。webhook 所需的 HashKey / HashIV 仍在 website（驗章 / 解密用）。兩支 API 皆用 `Authorization: Bearer <DONATION_GRANT_SECRET>`。

### 跨服務呼叫 1：建立 session（website → bot）

**`POST {BOT_API_BASE_URL}/api/donation/session`**

- Request body：

```json
{ "userId": "Discord 使用者 ID", "guildId": "主 guild ID", "amountNtd": 500, "platform": "ecpay" }
```

- Response 200：

```json
{ "ok": true, "sessionId": "uuid", "code": "DON-AB12CD" }
```

- 行為：bot 產生 `sessionId` 與 `code`（6 字元 Crockford-ish，前綴 `DON-`，去掉 0/1/I/L/O），寫 `donation_sessions`（pending，TTL 30 分），回傳給 website 顯示。
- 碰撞處理：若 6 碼撞到 30 分鐘內既有未完成 session，重試最多 5 次。

### 跨服務呼叫 2：發放（website → bot）

**`POST {BOT_API_BASE_URL}/api/donation/grant`**

- Request body（`userId` / `guildId` 由 bot 從 session 還原，不由 webhook 帶入 → 防偽造身分）：

```json
{
  "code": "DON-AB12CD",
  "tradeNo": "平台交易編號（冪等鍵）",
  "amountNtd": 500,
  "platform": "ecpay",
  "patronName": "donor 在收款頁填的名字",
  "patronNote": "donor 在收款頁填的留言全文"
}
```

- Response 200：

```json
{ "ok": true, "matched": true, "alreadyGranted": false,
  "perks": { "coins": 6000, "roleId": "...", "items": {"cd_ticket":0}, "luck": 0.08, "theme": "theme_donor", "title": "custom_30d" } }
```

- 行為：
  - 以 `tradeNo` 查 `donation_records` 做**冪等**——已存在則回 `alreadyGranted:true` 不重複發放。
  - 以 `code` 找 pending `donation_sessions` 取 `userId` / `guildId`；**找不到 → bot 自行寫 `unmatched_donations`，回 `{ ok:true, matched:false }`**（website 不需也不能寫 DB）。
  - 找到 → 依 `amountNtd` 對 `donation_tiers.json` 判定方案發放，**在同一筆動作**寫 `donation_records` 並把 `donation_sessions.status` 翻為 `completed`。
- 錯誤碼：`401` Bearer 不符、`400` 參數錯誤、`503` bot 未就緒或 DB 未掛載（website 收到非 2xx 應記錄並重試）。

### 共用 MongoDB collection 擁有權

| collection | 寫入方 | 讀取方 | 備註 |
|---|---|---|---|
| `donation_sessions` | bot（session API 建立 pending、grant API 翻 completed） | bot / website（唯讀輪詢） | `{ session_id, code(unique), user_id, guild_id, amount_ntd, platform, status('pending'\|'completed'\|'expired'), created_at }`，pending TTL 30 分 |
| `donation_records` | bot（grant API） | bot / website（唯讀） | `{ user_id, guild_id, amount_ntd, tier_id, platform, trade_no(unique), granted_at, perks, patron_name, patron_note }`，永久 |
| `unmatched_donations` | bot（grant API 找不到 code 時） | bot 管理指令 | `{ platform, trade_no, amount_ntd, patron_name, patron_note, code_attempt, ts, resolved }` |
| `UserCoins` / `CoinTransactions` | bot | bot / website（唯讀） | 既有經濟資料 |

### 抖內 buff 與 Twitch 訂閱疊加規則

- 挖礦 luck：抖內 + Twitch 相加後受 `luckCap = 25%` 全域限制。
- 身分組：贊助身分組與 Twitch 訂閱身分組可同時持有，效果獨立。
- 限定卡面：兩管道 id 不同，可各自解鎖。
- 永久頂級贊助者身分組不因 Twitch 訂閱取消而受影響。

---

## 14. 開發時程

| 步驟 | 內容 | 狀態 |
|---|---|---|
| W1 | Discord OAuth2 + `/donate` 三頁骨架 | ✅ 完成（PR #14） |
| W2 | `create`（呼叫 bot session API、回 code + paymentUrl）/ `status`（唯讀輪詢）+ confirm-form 兩段流程 | 進行中 |
| W3 | 綠界 / 歐付寶 webhook（解密 / 驗章 / code 抽取 / 呼叫 bot grant） | 進行中 |
| W4 | bot 端 session / grant API、`donation_tiers.json`、`unmatched_donations` | 待 bot 開發 |
| W5 | 可靠度測試（模擬付款、bot 不可用重送、code 打錯人工補發） | 待 W4 完成 |

> 前置：bibi-bot 端 `POST /api/donation/session`、`POST /api/donation/grant`、`donation_tiers.json`、`donation_sessions` / `donation_records` / `unmatched_donations` collection 需先完成（見 `bibi-bot/docs/MINING_SYSTEM_PLAN.md` Phase 8）。Atlas 需另開一個唯讀角色給 website。

_Last updated: 2026-05-28_
