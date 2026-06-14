<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 物品名稱一律顯示中文，禁止露出英文 id

任何會被使用者看到的文字（Discord 訊息、嵌入欄位、錯誤訊息如「材料不足」、按鈕/選單標籤、網站 dashboard 與 docs），提到礦石、魚、作物、種子、肥料、裝備、食物、道具、合成材料等項目時，**一律顯示中文名稱（可搭配 emoji），絕對不要直接輸出原始 id**（例如 `broken_trap_fragment`、`gold_sword`、`seed_black_rose`）。

這類錯誤已經重複發生很多次，務必檢查：

- 顯示前先用對應的名稱表把 id 轉成中文，再組字串。本 repo 的名稱表集中在 `src/lib/dashboard/botDefs.ts`（`ORES`／`FISH`／`PICKAXES`／`RODS`／`WEAPONS`／`SHOP_ITEMS`／`CROPS`／`SEEDS`／`FERTILIZERS`／`RECIPES` 等）；bot 端對應 `src/config/*.json`。新增項目時兩邊都要補，缺名稱會 fallback 成 `(id)`。
- 特別留意**錯誤／例外路徑**（材料不足、庫存不足、找不到項目）——bug 最常出現在這裡，因為平常的 happy path 有轉名稱，錯誤訊息卻直接內插 id 或 key。
- 數量／材料清單（`xxx ×5`）也要用中文名，不能用 id。
- 送出前自我檢查：搜尋字串樣板裡有沒有 snake_case 的識別字漏接名稱表（例如 `grep -nE '[a-z]+_[a-z_]+' 你改動的使用者可見字串`），確認每個都已轉成中文。
