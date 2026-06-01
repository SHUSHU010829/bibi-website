# 逼逼機器人 Dashboard — 下一階段開發企劃書

> 接續 `bibi-bot/docs/DASHBOARD_PLAN.md`（W0–W6+）與 `bibi-bot/docs/PLAN_INTEGRATED.md`（Phase G）。
> 本文件聚焦 **bibi-website 的 dashboard 下一階段**，定義 Admin 後台、公開社交面、Member UX 升級三條路線。
>
> 最後更新：2026-06-01

---

## 0. 現況盤點

### 已完成

| 規劃 | 範圍 | 狀態 |
|---|---|---|
| W0 前置重構 | DB env、httpServer 模組化、CORS / helmet / rate-limit | ✅ |
| W1 Auth 基礎建設 | Discord OAuth2、session cookie、`/api/auth/discord/*` | ✅ |
| W5 Member MVP | `/dashboard` Overview / 背包 / 任務 / 稱號 / 金流 / 稅務 / 邀請 / 樂透 | ✅ 已超越原規劃 |
| Phase 8 抖內 | website session/grant → bot httpServer | ✅ |
| Phase F 市價波動 | 行情公告 + `/行情` 指令 | ✅ |
| Phase S4 釣魚 | `/fish`、`/cook`、buff 整合 | ✅ |
| Phase S5 限時活動 | eventEngine + 排程公告 | ✅ |

### 未完成

| 規劃 | 範圍 | 狀態 |
|---|---|---|
| W2–W3 Admin 後台核心 | 經濟管理 / 推播開關 / 投票管理 | ❌ |
| W4 Admin 後台延伸 | 商店 / 交易日誌 / 稽核 / Cron 監控 | ❌ |
| Phase G 贊助後台 | records / unmatched / patrons / stats | ❌ |
| W6+ 進階 | realtime、charts、行動版 polish、深色模式 | ❌ |
| 公開排行榜 UI | bot API 已就緒（`/api/v1/leaderboard/*`），UI 未做 | ❌ |

**重點觀察**：

- Member 端「自己看自己」已經很完整。
- 缺的是**管理員操作面**（admin 後台）與**公開社交面**（排行榜、投票、商店）。
- 痛點優先序：unmatched donation 處理 > coin 手動調整 > cron 監控 > 推播開關。

---

## 1. 三條路線總覽

| 路線 | 工期 | 痛感 | 流量價值 | 開發成本 |
|---|---|---|---|---|
| 🅰️ Admin 後台 | 5–7 天 | 高 | 低 | 中 |
| 🅱️ 公開社交面 | 3–4 天 | 中 | 高 | 低（API 已就緒） |
| 🅲️ Member UX 升級 | 2–3 天 | 低 | 中 | 低 |

**建議順序**：`🅰️ Step 1–4 → 🅱️ → 🅲️ → 🅰️ Step 5`

理由：
1. Admin 痛點明確、ROI 最高（尤其 unmatched donation）
2. 公開排行榜 bot API 已開好，前端做完馬上有可分享內容
3. UX polish 放在實際使用者反饋之後再做，避免提早優化
4. 推播 / 投票 / 商店這些低痛點功能留到最後

---

## 🅰️ 路線 A：Admin 後台

### A-Step 1 — 權限基礎建設（0.5 天）

**目標**：建立可信任的 admin 入口，所有後續 admin 操作共用。

- `bibi-bot` 新增 `requireAdmin(guildId)` middleware（讀 Discord guild member 的 `ManageGuild` / `Administrator` permission flag）
- `bibi-website` 加 `app/admin/layout.tsx`：未授權使用者 redirect 到 `/dashboard`
- 新增 `DashboardAuditLog` collection：

```js
{
  admin_id:     String,
  action:       String,   // 'donation.resolve' | 'economy.adjust' | 'cron.run' | ...
  target_id:    String,   // 通常是 userId
  payload:      Object,   // 操作內容
  reason:       String,   // 管理員填寫
  ip:           String,
  ts:           Number,
}
```
- 所有 admin API 透過 helper `withAudit(action)(handler)` 自動寫稽核

**驗收**：用非 admin 帳號登入後訪問 `/admin/*` 會被導走；admin 帳號可看到空殼頁面。

---

### A-Step 2 — Phase G 贊助後台（2 天）

**目標**：管理員不再需要進 Discord 用 `/donation-admin` 指令處理贊助異常。

#### 頁面

**`/admin/donation`（records 列表）**
- 欄位：時間 / 玩家（名稱 + 頭像）/ 平台 / 金額 / 方案 / 發放狀態 / tradeNo
- 篩選：日期範圍、平台（ecpay/opay）、金額區間、是否已發放
- 操作：重發（已發放但 perks 異常時補發）、查看 raw payload
- 匯出 CSV（給會計對帳）

**`/admin/donation/unmatched`（未對應）**
- 列出所有「webhook 來了但 code 對不到 session」的紀錄
- 搜尋 Discord 玩家（by username 或 ID）→ 手動綁定 → 觸發補發
- 狀態切換：pending / resolved / refunded

**`/admin/donation/patrons`（贊助者清單）**
- 累積金額 desc 排序
- 顯示：當前生效的 buff、role、稱號到期時間
- 永久贊助者（至尊方案）特別標注
- 點進去看單一玩家的完整贊助史

**`/admin/donation/stats`（看板）**
- 當月 / 季 / 年累積金額、筆數、平均單筆金額
- 平台分佈圓餅圖（ecpay vs opay）
- 7 / 30 / 90 天趨勢線

#### bot 新增 API

```
GET  /api/v1/admin/donation/records?from=&to=&platform=&granted=&page=
GET  /api/v1/admin/donation/unmatched?status=
POST /api/v1/admin/donation/unmatched/:id/resolve   Body: { userId, reason }
GET  /api/v1/admin/donation/patrons?sort=lifetime|recent&page=
GET  /api/v1/admin/donation/patrons/:userId         // 單人完整史
GET  /api/v1/admin/donation/stats?range=30d|90d|365d
```

#### 驗收
- 真實 unmatched 紀錄能在 dashboard 完成綁定 + 補發 + 看到稽核紀錄
- CSV 匯出可被 Excel 開啟，欄位齊全

---

### A-Step 3 — 經濟管理（1.5 天）

**目標**：取代「需要進 bot console 改資料庫」的手動補償流程。

**`/admin/economy`**
- 搜尋玩家（by Discord ID 或 username）→ 顯示摘要卡片：
  - 持有 coin、累計 coin、等級、最近 30 天淨流入
  - 最近 10 筆 CoinTransactions
- 調整介面：
  - 加 / 減 coin、改等級
  - **必填欄位**：理由（≥ 5 字）
  - 二次確認 modal（顯示變動前後值）
- 所有調整：
  - 寫進 `CoinTransactions`（source = `admin_adjust`）
  - 寫進 `DashboardAuditLog`
  - 可選：自動 DM 玩家通知（reason 寫進 embed）

#### bot 新增 API

```
GET  /api/v1/admin/users/search?q=                 // 模糊搜尋
GET  /api/v1/admin/users/:userId                   // 完整摘要
POST /api/v1/admin/users/:userId/coins
       Body: { delta: number, reason: string, notify?: boolean }
POST /api/v1/admin/users/:userId/level
       Body: { delta: number, reason: string }
```

#### 驗收
- 管理員可在 5 步內完成「+1000 coin 給玩家 X，理由：補償活動 bug」並通知對方

---

### A-Step 4 — Cron 監控（1.5 天）

**目標**：替代「ssh 上 server tail log」才能知道排程跑沒跑的情況。

#### bot 端

- 新增 `CronJobLog` collection：

```js
{
  name:         String,   // 'ore_market.freeze' | 'twitch.check' | ...
  started_at:   Number,
  finished_at:  Number,
  status:       String,   // 'success' | 'failed' | 'running'
  duration_ms:  Number,
  result:       Object,   // 任務自定義輸出（例如「公告幾人」）
  error:        String,
}
// TTL index: 90 天
```

- 新增 helper `src/utils/withCronLog.js`：

```js
async function withCronLog(name, fn) {
  const startedAt = Date.now();
  const doc = await cronJobLog.insertOne({ name, started_at: startedAt, status: 'running' });
  try {
    const result = await fn();
    await cronJobLog.updateOne(
      { _id: doc.insertedId },
      { $set: { status: 'success', finished_at: Date.now(),
                duration_ms: Date.now() - startedAt, result } }
    );
    return result;
  } catch (err) {
    await cronJobLog.updateOne(
      { _id: doc.insertedId },
      { $set: { status: 'failed', finished_at: Date.now(),
                duration_ms: Date.now() - startedAt, error: String(err) } }
    );
    throw err;
  }
}
```

- 改造現有 cron（須逐一驗證）：
  - Steam deals push、Free Games push、Twitch check、RSS
  - 財富稅每週結算、樂透開獎、釣魚 CD reset
  - 行情 freeze（`oreMarketScheduler`）、活動 scheduler（`eventScheduler`）
  - daily 連勝重置、稱號週冠換王

#### website 端

**`/admin/cron`**
- 列出所有已知 cron 任務（名稱、cron expression、上次執行時間 / 狀態 / 耗時）
- 點進單一任務 → 看歷史 50 筆執行紀錄
- 失敗紀錄高亮 + error stack
- [Run now] 按鈕（Owner only，寫稽核 + 立即跑一次）

#### bot 新增 API

```
GET  /api/v1/admin/cron/jobs              // 列任務 + 最近一次紀錄
GET  /api/v1/admin/cron/jobs/:name/runs?limit=50
POST /api/v1/admin/cron/jobs/:name/run    // Owner only
```

#### 驗收
- Steam push 故意丟錯 → dashboard 上立刻看到紅色 failed 紀錄 + stack
- [Run now] 能手動觸發行情 freeze

---

### A-Step 5 — 交易日誌 / 推播 / 投票 / 商店（1–2 天，可延後）

**痛感較低，列為 Admin 路線的次要項目。**

- `/admin/logs`：CoinTransactions / ShopTransactions / DonationRecords 統一查詢 + 匯出
- `/admin/push`：先做唯讀（顯示目前 .env 旗標 + cron 狀態），需要寫入時再做 `BotConfig` collection
- `/admin/voting`、`/admin/shop`：暫緩，當實際有運營需求再做

---

## 🅱️ 路線 B：公開社交面

### B-Step 1 — 排行榜頁（1.5 天）

bot 端 API 已就緒（`bibi-bot/docs/DASHBOARD_PLAN.md` § 4.3），前端直接接。

**`/leaderboard`（總覽，自動帶 PRIMARY_GUILD_ID）**
- 三個 tab：挖礦 / 稱號 / 週榜
- 上方 hero：本週冠軍卡片（頭像、稱號、數據）

**`/leaderboard/mining`**
- type 切換：`count` / `value` / `diamond`
- period 切換：`today` / `week` / `month` / `all`
- 表格 + 前 3 名特殊樣式

**`/leaderboard/titles`**
- 稱號榜（誰穿了多少稀有稱號）

**`/leaderboard/weekly-summary`**
- 週榜（公告風格頁面，可拿來做 Discord 自動發圖 / OG image）

### B-Step 2 — 隱私 opt-out（0.5 天）

新增 `UserSettings.public_profile` 欄位（預設 `false`）。

- bot 端：`/設定 公開資料 on|off` 指令
- bot leaderboard API：未開啟者匿名顯示（名字 → `匿名玩家`、頭像 → 預設）
- dashboard 端：個人設定頁切換開關

### B-Step 3 — 個人公開卡片 `/u/[userId]`（1 天）

- 可分享連結（不需登入），但內容受 `public_profile` 控制
- 內容：稱號、等級、簽到天數、累計挖礦 / 釣魚
- 預設取個人卡片 OG image（用 `@vercel/og` 或 next/og 動態產生）

### B-Step 4 — 投票 / 商店唯讀頁（1 天）

bot API 還沒做，這部分要先補：

```
GET /api/v1/voting/proposals?guildId=
GET /api/v1/shop/items?guildId=
```

dashboard 端做純展示，不開操作。

---

## 🅲️ 路線 C：Member UX 升級

### C-Step 1 — 趨勢圖（1 天）

- 安裝 `recharts`
- Overview tab 新增「30 天 coin 流入/流出」「30 天 XP 累積」「30 天活躍度」三張小圖
- 資料來源：`CoinTransactions`、`UserLevelHistory`（如有）
- 沒資料的天用 0 補齊，避免折線斷掉

### C-Step 2 — 行動版 polish（1 天）

- 現有 `d-grid-2` / `d-grid-3` / `d-grid-5` 在 `<768px` 應該都會塞
- 統一改成 `repeat(auto-fit, minmax(...))`
- `d-tabs` 在窄螢幕做橫滑 scroll
- `d-table-wrap` 加 sticky header + 第一欄

### C-Step 3 — 深色模式 + 視覺強化（0.5 天）

- 把 `globals.css` 內的固定色拉成 CSS variables
- `prefers-color-scheme` 自動切換 + 手動 toggle（存 localStorage）

### C-Step 4 — 稱號展示頁（0.5 天）

- `/badges` 公開頁（任何人可看伺服器有哪些稱號）
- 點進去看該稱號目前的擁有者
- 可作為公會招募 / 行銷素材

---

## 2. 跨路線共用基礎建設

無論先做哪條路線，這幾項都要先補：

| 項目 | 在哪 | 為什麼 |
|---|---|---|
| `requireAdmin` middleware | bibi-bot | A 全部都用得到 |
| `DashboardAuditLog` collection | bibi-bot | A 全部都要寫 |
| `withCronLog` helper | bibi-bot | A-Step 4 用，但其他 cron 也建議包 |
| `UserSettings.public_profile` | bibi-bot | B 排行榜的隱私保護必要 |
| `app/admin/layout.tsx` + guard | bibi-website | A 全部都掛在底下 |
| 共用 `fetcher` for admin API | bibi-website | 統一帶 cookie + error handling |

---

## 3. 風險與決策待辦

| 項目 | 風險 | 處理 |
|---|---|---|
| Admin API 跨 origin cookie | dashboard 在 zeabur、bot 在 VPS | `SameSite=None; Secure` + CORS 白名單；現有 donation API 已驗證可行 |
| 排行榜被刷 | 公開無 auth、可能造成 DB 壓力 | rate-limit + Mongo index 必檢查；考慮 5 分鐘 cache |
| 稽核日誌資料量 | 90 天可能上萬筆 | TTL index + 必要欄位 index（admin_id / action） |
| 手動補發冪等 | unmatched resolve 後再點一次 | bot 端用既有 `tradeNo` unique 防呆 |
| 推播開關改 DB 驅動 | 既有 cron 仍讀 .env | A-Step 5 第一版唯讀，第二版才寫入 |

---

## 4. 開發時程總覽

| 路線 | Step | 工期 | 依賴 |
|---|---|---|---|
| 🅰️ Admin | Step 1 權限基礎 | 0.5 天 | — |
| 🅰️ Admin | Step 2 贊助後台 | 2 天 | Step 1 |
| 🅰️ Admin | Step 3 經濟管理 | 1.5 天 | Step 1 |
| 🅰️ Admin | Step 4 Cron 監控 | 1.5 天 | Step 1 |
| 🅰️ Admin | Step 5 雜項 | 1–2 天 | Step 1（可延後） |
| 🅱️ 公開 | Step 1 排行榜 | 1.5 天 | — |
| 🅱️ 公開 | Step 2 隱私 opt-out | 0.5 天 | Step 1 |
| 🅱️ 公開 | Step 3 個人卡片 | 1 天 | Step 2 |
| 🅱️ 公開 | Step 4 投票 / 商店 | 1 天 | bot 端 API |
| 🅲️ UX | Step 1 趨勢圖 | 1 天 | — |
| 🅲️ UX | Step 2 行動版 | 1 天 | — |
| 🅲️ UX | Step 3 深色模式 | 0.5 天 | — |
| 🅲️ UX | Step 4 稱號展示頁 | 0.5 天 | 🅱️ Step 2 |
| **合計** | | **12–14 天** | |

---

## 5. 新增 / 修改檔案索引

### bibi-bot

| 檔案 | 內容 | 路線 |
|---|---|---|
| `src/httpServer/middleware/requireAdmin.js` | admin 權限 middleware | A1 |
| `src/httpServer/middleware/withAudit.js` | 稽核自動寫入 | A1 |
| `src/httpServer/routes/admin/donation.js` | 贊助後台 API | A2 |
| `src/httpServer/routes/admin/users.js` | 經濟管理 API | A3 |
| `src/httpServer/routes/admin/cron.js` | Cron 監控 API | A4 |
| `src/httpServer/routes/leaderboard/*` | 已存在，無變動 | B1 |
| `src/httpServer/routes/voting.js` | 投票公開 API | B4 |
| `src/httpServer/routes/shop.js` | 商店公開 API | B4 |
| `src/utils/withCronLog.js` | cron 自動寫 log helper | A4 |
| `src/events/ready/connectDb.js` | 新增 DashboardAuditLog、CronJobLog、UserSettings index | A1, A4, B2 |
| `src/commands/settings/settings.js` | `/設定` 指令含 public_profile | B2 |

### bibi-website

| 檔案 | 內容 | 路線 |
|---|---|---|
| `src/app/admin/layout.tsx` | admin guard | A1 |
| `src/app/admin/donation/page.tsx` | 贊助 records | A2 |
| `src/app/admin/donation/unmatched/page.tsx` | unmatched 處理 | A2 |
| `src/app/admin/donation/patrons/page.tsx` | 贊助者清單 | A2 |
| `src/app/admin/donation/stats/page.tsx` | 看板 | A2 |
| `src/app/admin/economy/page.tsx` | 經濟管理 | A3 |
| `src/app/admin/cron/page.tsx` | Cron 監控 | A4 |
| `src/app/leaderboard/page.tsx` | 排行榜總覽 | B1 |
| `src/app/leaderboard/mining/page.tsx` | 挖礦榜 | B1 |
| `src/app/leaderboard/titles/page.tsx` | 稱號榜 | B1 |
| `src/app/leaderboard/weekly-summary/page.tsx` | 週榜 | B1 |
| `src/app/u/[userId]/page.tsx` | 個人公開卡片 | B3 |
| `src/app/u/[userId]/opengraph-image.tsx` | OG image | B3 |
| `src/lib/admin/fetcher.ts` | admin API 共用 fetch | A1 |
| `src/lib/dashboard/charts.ts` | 趨勢資料聚合 | C1 |
| `src/components/charts/*` | recharts 元件 | C1 |

---

_Last updated: 2026-06-01_
