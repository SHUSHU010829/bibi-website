/**
 * 統一的台北時區時間格式化工具。
 *
 * 動機：Next.js server component 跑在容器內，時區通常是 UTC；如果直接用
 * `new Date().toLocaleString("zh-TW", {...})` 不指定 timeZone，會被 server
 * 的本地時區（UTC）決定，使用者看到的時間會差 8 小時。
 *
 * 所有日期 / 時間顯示都應透過這裡，不要直接 toLocaleString 不帶 timeZone。
 */

const TAIPEI = "Asia/Taipei";

type DateInput = Date | string | number;

function toDate(d: DateInput): Date {
  return d instanceof Date ? d : new Date(d);
}

/** YYYY/MM/DD HH:mm — 用於大部分清單時間欄位 */
export function fmtDateTime(d: DateInput): string {
  return toDate(d).toLocaleString("zh-TW", {
    timeZone: TAIPEI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** MM/DD HH:mm — 短版，省年份（同年內事件常用） */
export function fmtShortDateTime(d: DateInput): string {
  return toDate(d).toLocaleString("zh-TW", {
    timeZone: TAIPEI,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** MM/DD HH:mm:ss — 含秒，用於 cron 監控 */
export function fmtDateTimeWithSeconds(d: DateInput): string {
  return toDate(d).toLocaleString("zh-TW", {
    timeZone: TAIPEI,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** YYYY/MM/DD — 只要日期 */
export function fmtDate(d: DateInput): string {
  return toDate(d).toLocaleDateString("zh-TW", {
    timeZone: TAIPEI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** HH:mm — 只要時間（24h） */
export function fmtTime(d: DateInput): string {
  return toDate(d).toLocaleTimeString("zh-TW", {
    timeZone: TAIPEI,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
