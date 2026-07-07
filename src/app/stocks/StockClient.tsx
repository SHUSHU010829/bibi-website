"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type {
  StockQuote,
  StockSeries,
  StockPeriod,
} from "@/lib/dashboard/stocks";

type Mode = "line" | "candle";

const PERIOD_TABS: { id: StockPeriod; label: string }[] = [
  { id: "1h", label: "1小時" },
  { id: "1d", label: "1天" },
  { id: "1w", label: "1週" },
  { id: "1m", label: "1月" },
];

const SENTIMENT_LABEL: Record<string, string> = {
  bull: "🐮 多頭",
  bear: "🐻 空頭",
  sideways: "➖ 盤整",
};

const PERIOD_IDS = PERIOD_TABS.map((p) => p.id);
const MODES: Mode[] = ["line", "candle"];
const LS_SYMBOL = "bibi.stocks.symbol";
const LS_PERIOD = "bibi.stocks.period";
const LS_MODE = "bibi.stocks.mode";

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 隱私模式或配額滿：略過，不影響功能 */
  }
}

const UP = "#6cc98a";
const DOWN = "#e57373";
const FLAT = "#8a8c84";
// 成交量用去飽和的細線色，和上方 K 線的鮮明綠紅區隔，避免視覺混淆。
const VOL_UP = "#8fb7a2";
const VOL_DOWN = "#c79a9a";
const BB_PERIOD = 20;

function colorFor(pct: number): string {
  return pct > 0 ? UP : pct < 0 ? DOWN : FLAT;
}

function fmtPrice(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

const TIME_FMT_HM = new Intl.DateTimeFormat("zh-TW", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Taipei",
});
const TIME_FMT_MD = new Intl.DateTimeFormat("zh-TW", {
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Taipei",
});

function fmtAxisTime(t: number, period: StockPeriod): string {
  return period === "1h" || period === "1d"
    ? TIME_FMT_HM.format(t)
    : TIME_FMT_MD.format(t);
}

// hover 提示框用完整日期+時間，避免只看到時分不知是哪天。
const TIME_FMT_FULL = new Intl.DateTimeFormat("zh-TW", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Taipei",
});

function fmtVol(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

// SVG 無法量測文字寬度，用 CJK≈13 / 其餘≈7 估算提示框寬度。
function estTextW(s: string): number {
  let w = 0;
  for (const ch of s) w += /[　-〿一-鿿—]/.test(ch) ? 13 : 7;
  return w;
}

// ── 布林通道：對收盤序列做 SMA / ±2σ ────────────────────────────────────
function bollinger(
  closes: number[],
): { mid: number; upper: number; lower: number }[] {
  const out: { mid: number; upper: number; lower: number }[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < BB_PERIOD - 1) {
      out.push({ mid: NaN, upper: NaN, lower: NaN });
      continue;
    }
    let sum = 0;
    for (let j = i - BB_PERIOD + 1; j <= i; j++) sum += closes[j];
    const mean = sum / BB_PERIOD;
    let variance = 0;
    for (let j = i - BB_PERIOD + 1; j <= i; j++) {
      const d = closes[j] - mean;
      variance += d * d;
    }
    const std = Math.sqrt(variance / BB_PERIOD);
    out.push({ mid: mean, upper: mean + 2 * std, lower: mean - 2 * std });
  }
  return out;
}

// ── SVG 幾何 ────────────────────────────────────────────────────────────
const W = 820;
const PAD_L = 10;
const PAD_R = 56;
const PAD_T = 14;
const PRICE_H = 300;
const GAP_V = 12;
const VOL_H = 64;
const PAD_B = 24;
const PRICE_BOTTOM = PAD_T + PRICE_H;
const VOL_TOP = PRICE_BOTTOM + GAP_V;
const VOL_BOTTOM = VOL_TOP + VOL_H;
const H = VOL_BOTTOM + PAD_B;
const PLOT_W = W - PAD_L - PAD_R;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function Chart({ series, mode }: { series: StockSeries; mode: Mode }) {
  const { points, candles, volume, period, bucketMs } = series;
  // 布林只在較長期間（1週/1月）顯示，短期間資料點不足自動隱藏。
  const showBB = period === "1w" || period === "1m";

  const geom = useMemo(() => {
    // x 取實際資料範圍（比 since..now 緊湊，避免收盤時段大片空白）
    const anchors: number[] = [];
    if (mode === "line") {
      for (const p of points) anchors.push(p.t);
    } else {
      for (const c of candles) anchors.push(c.t + bucketMs / 2);
    }
    if (anchors.length === 0) return null;
    const xMin = anchors[0];
    const xMax = anchors[anchors.length - 1];
    const xSpan = xMax - xMin || 1;
    const x = (t: number) => PAD_L + ((t - xMin) / xSpan) * PLOT_W;

    const closes = mode === "line" ? points.map((p) => p.p) : candles.map((c) => c.c);
    const bb = showBB ? bollinger(closes) : null;

    // y 範圍：涵蓋價格 + 布林上下軌
    let yMin = Infinity;
    let yMax = -Infinity;
    const seen = (v: number) => {
      if (v < yMin) yMin = v;
      if (v > yMax) yMax = v;
    };
    if (mode === "line") {
      for (const p of points) seen(p.p);
    } else {
      for (const c of candles) {
        seen(c.h);
        seen(c.l);
      }
    }
    if (bb) {
      for (const b of bb) {
        if (!Number.isNaN(b.upper)) seen(b.upper);
        if (!Number.isNaN(b.lower)) seen(b.lower);
      }
    }
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) return null;
    const pad = (yMax - yMin) * 0.06 || yMax * 0.02 || 1;
    yMin -= pad;
    yMax += pad;
    const ySpan = yMax - yMin || 1;
    const y = (v: number) => PRICE_BOTTOM - ((v - yMin) / ySpan) * PRICE_H;

    const maxVol = volume.reduce((m, b) => Math.max(m, b.buy + b.sell), 0) || 1;
    const yVol = (v: number) => (v / maxVol) * VOL_H;

    // 價格軸 5 條格線
    const ticks: { v: number; y: number }[] = [];
    for (let i = 0; i <= 4; i++) {
      const v = yMin + (ySpan * i) / 4;
      ticks.push({ v, y: y(v) });
    }

    return { x, y, yVol, xMin, xMax, closes, bb, ticks };
  }, [points, candles, volume, mode, showBB, bucketMs]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverI, setHoverI] = useState<number | null>(null);

  if (!geom) {
    return (
      <div className="stk-chart-empty">此期間內尚無足夠資料 📭</div>
    );
  }

  const { x, y, yVol, bb, ticks } = geom;

  // hover：以主序列（折線=points / K線=candles 中心）做最近點命中，量柱依同一分桶對齊。
  const primaryX = (i: number) =>
    mode === "line" ? x(points[i].t) : x(candles[i].t + bucketMs / 2);
  const primaryLen = mode === "line" ? points.length : candles.length;
  const hitXs: number[] = [];
  for (let i = 0; i < primaryLen; i++) hitXs.push(primaryX(i));
  const volByBucket = new Map(volume.map((b) => [b.t, b]));

  const onHoverMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || hitXs.length === 0) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const ux = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()).x;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < hitXs.length; i++) {
      const d = Math.abs(hitXs[i] - ux);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    setHoverI(best);
  };

  const linePath =
    mode === "line" && points.length
      ? "M " + points.map((p) => `${x(p.t).toFixed(1)} ${y(p.p).toFixed(1)}`).join(" L ")
      : "";

  // 布林：連續 defined 區段
  let bbBandPath = "";
  let bbMidPath = "";
  if (bb) {
    const xs =
      mode === "line" ? points.map((p) => x(p.t)) : candles.map((c) => x(c.t + bucketMs / 2));
    const defined = bb
      .map((b, i) => ({ b, xi: xs[i] }))
      .filter((d) => !Number.isNaN(d.b.mid));
    if (defined.length > 1) {
      const up = defined.map((d) => `${d.xi.toFixed(1)} ${y(d.b.upper).toFixed(1)}`);
      const low = defined
        .slice()
        .reverse()
        .map((d) => `${d.xi.toFixed(1)} ${y(d.b.lower).toFixed(1)}`);
      bbBandPath = `M ${up.join(" L ")} L ${low.join(" L ")} Z`;
      bbMidPath = "M " + defined.map((d) => `${d.xi.toFixed(1)} ${y(d.b.mid).toFixed(1)}`).join(" L ");
    }
  }

  const nVol = volume.length || 1;
  const volW = clamp((PLOT_W / nVol) * 0.5, 1, 3);
  const nC = candles.length || 1;
  const candleW = clamp((PLOT_W / nC) * 0.6, 1, 14);

  // ── hover 提示：十字準線 + 標記點 + 資訊框 ──
  const hi = hoverI != null && hoverI < primaryLen ? hoverI : null;
  let overlay: ReactNode = null;
  if (hi != null) {
    const hx = hitXs[hi];
    const t = mode === "line" ? points[hi].t : candles[hi].t;
    const bucketKey =
      mode === "line" ? Math.floor(points[hi].t / bucketMs) * bucketMs : candles[hi].t;
    const vb = volByBucket.get(bucketKey);
    const markerY = mode === "line" ? y(points[hi].p) : y(candles[hi].c);

    const priceLines =
      mode === "line"
        ? [`價 ${fmtPrice(points[hi].p)}`]
        : [
            `開 ${fmtPrice(candles[hi].o)}  收 ${fmtPrice(candles[hi].c)}`,
            `高 ${fmtPrice(candles[hi].h)}  低 ${fmtPrice(candles[hi].l)}`,
          ];
    const volStr = vb ? `買 ${fmtVol(vb.buy)}  賣 ${fmtVol(vb.sell)}` : "量 —";
    const timeStr = TIME_FMT_FULL.format(t);
    const allStr = [timeStr, ...priceLines, volStr];

    const lineH = 16;
    const padX = 9;
    const padY = 8;
    const boxW = Math.max(...allStr.map(estTextW)) + padX * 2;
    const boxH = allStr.length * lineH + padY * 2 - 3;
    let boxX = hx + 12;
    if (boxX + boxW > PAD_L + PLOT_W) boxX = hx - 12 - boxW;
    boxX = clamp(boxX, PAD_L, Math.max(PAD_L, PAD_L + PLOT_W - boxW));
    const boxY = PAD_T + 2;
    const textX = padX;
    const rowY = (n: number) => padY + lineH * n + 12;

    overlay = (
      <g pointerEvents="none">
        <line
          x1={hx}
          x2={hx}
          y1={PAD_T}
          y2={VOL_BOTTOM}
          stroke="var(--ink-4)"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.8}
        />
        <circle
          cx={hx}
          cy={markerY}
          r={3.5}
          fill="var(--accent)"
          stroke="var(--paper)"
          strokeWidth={1.5}
        />
        <g transform={`translate(${boxX.toFixed(1)} ${boxY})`}>
          <rect
            width={boxW}
            height={boxH}
            rx={6}
            fill="var(--paper-2)"
            stroke="var(--line)"
            strokeWidth={1}
          />
          <text x={textX} y={rowY(0)} fontSize={12} fill="var(--ink-3)" fontFamily="var(--mono)">
            {timeStr}
          </text>
          {priceLines.map((s, i) => (
            <text
              key={i}
              x={textX}
              y={rowY(1 + i)}
              fontSize={12}
              fill="var(--ink)"
              fontFamily="var(--mono)"
            >
              {s}
            </text>
          ))}
          <text
            x={textX}
            y={rowY(1 + priceLines.length)}
            fontSize={12}
            fontFamily="var(--mono)"
          >
            {vb ? (
              <>
                <tspan fill={VOL_UP}>買 {fmtVol(vb.buy)}</tspan>
                <tspan fill="var(--ink-4)">　</tspan>
                <tspan fill={VOL_DOWN}>賣 {fmtVol(vb.sell)}</tspan>
              </>
            ) : (
              <tspan fill="var(--ink-4)">量 —</tspan>
            )}
          </text>
        </g>
      </g>
    );
  }

  return (
    <svg
      ref={svgRef}
      className="stk-svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="股價走勢圖"
      onPointerMove={onHoverMove}
      onPointerDown={onHoverMove}
      onPointerLeave={() => setHoverI(null)}
    >
      {/* 價格格線 + 右側刻度 */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={PAD_L + PLOT_W}
            y1={t.y}
            y2={t.y}
            stroke="var(--line)"
            strokeWidth={1}
            strokeDasharray={i === 0 ? "0" : "2 4"}
            opacity={0.5}
          />
          <text
            x={PAD_L + PLOT_W + 6}
            y={t.y + 3}
            fontSize={11}
            fill="var(--ink-3)"
            fontFamily="var(--mono)"
          >
            {fmtPrice(t.v)}
          </text>
        </g>
      ))}

      {/* 布林通道 */}
      {bbBandPath && (
        <path d={bbBandPath} fill="var(--accent)" opacity={0.08} stroke="none" />
      )}
      {bbMidPath && (
        <path
          d={bbMidPath}
          fill="none"
          stroke="var(--accent-2)"
          strokeWidth={1.2}
          strokeDasharray="4 3"
          opacity={0.75}
        />
      )}

      {/* 主體：折線 or K 線 */}
      {mode === "line" && linePath && (
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {mode === "candle" &&
        candles.map((c, i) => {
          const cx = x(c.t + bucketMs / 2);
          const up = c.c >= c.o;
          const col = up ? UP : DOWN;
          const yo = y(c.o);
          const yc = y(c.c);
          const bodyTop = Math.min(yo, yc);
          const bodyH = Math.max(1, Math.abs(yc - yo));
          return (
            <g key={i}>
              <line
                x1={cx}
                x2={cx}
                y1={y(c.h)}
                y2={y(c.l)}
                stroke={col}
                strokeWidth={1}
              />
              <rect
                x={cx - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyH}
                fill={col}
              />
            </g>
          );
        })}

      {/* 成交量（買綠 / 賣紅堆疊，細線與上方 K 線區隔） */}
      <line
        x1={PAD_L}
        x2={PAD_L + PLOT_W}
        y1={VOL_BOTTOM}
        y2={VOL_BOTTOM}
        stroke="var(--line)"
        strokeWidth={1}
        opacity={0.6}
      />
      {volume.map((b, i) => {
        const cx = x(b.t + bucketMs / 2);
        const hBuy = yVol(b.buy);
        const hSell = yVol(b.sell);
        return (
          <g key={i}>
            <line
              x1={cx}
              x2={cx}
              y1={VOL_BOTTOM}
              y2={VOL_BOTTOM - hBuy}
              stroke={VOL_UP}
              strokeWidth={volW}
              opacity={0.7}
            />
            <line
              x1={cx}
              x2={cx}
              y1={VOL_BOTTOM - hBuy}
              y2={VOL_BOTTOM - hBuy - hSell}
              stroke={VOL_DOWN}
              strokeWidth={volW}
              opacity={0.7}
            />
          </g>
        );
      })}

      {/* 時間軸標籤 */}
      {[0, 0.5, 1].map((f, i) => {
        const t = geom.xMin + (geom.xMax - geom.xMin) * f;
        const px = PAD_L + PLOT_W * f;
        return (
          <text
            key={i}
            x={clamp(px, PAD_L + 14, PAD_L + PLOT_W - 14)}
            y={H - 6}
            fontSize={11}
            fill="var(--ink-3)"
            fontFamily="var(--mono)"
            textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
          >
            {fmtAxisTime(t, period)}
          </text>
        );
      })}
      {/* 量區小字 */}
      <text x={PAD_L} y={VOL_TOP - 3} fontSize={10} fill="var(--ink-4)" fontFamily="var(--mono)">
        成交量
      </text>

      {/* hover 提示（最上層） */}
      {overlay}
    </svg>
  );
}

export function StockClient({
  initialQuotes,
  initialSymbol,
  initialPeriod,
  initialSeries,
}: {
  initialQuotes: StockQuote[];
  initialSymbol: string;
  initialPeriod: StockPeriod;
  initialSeries: StockSeries | null;
}) {
  const [quotes, setQuotes] = useState<StockQuote[]>(initialQuotes);
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [period, setPeriod] = useState<StockPeriod>(initialPeriod);
  const [mode, setMode] = useState<Mode>("line");
  const [series, setSeries] = useState<StockSeries | null>(initialSeries);
  const [updatedAt, setUpdatedAt] = useState<number | null>(initialSeries?.now ?? null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (sym: string, per: StockPeriod, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const r = await fetch(
          `/api/stocks?symbol=${encodeURIComponent(sym)}&period=${per}`,
          { cache: "no-store" },
        );
        const j = await r.json();
        if (j.ok) {
          setQuotes(j.quotes as StockQuote[]);
          if (j.symbol === sym && j.period === per) {
            setSeries(j.series as StockSeries | null);
          }
          setUpdatedAt(j.updatedAt as number);
        }
      } catch {
        /* 網路瞬斷：維持現有畫面，下次輪詢再補 */
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [],
  );

  // 掛載後從 localStorage 還原使用者偏好。首渲染必須沿用 initial props 以匹配 SSR，
  // 因此偏好只能在掛載後套用——這是唯讀外部狀態的一次性同步，非串接式渲染。
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const savedSymbol = lsGet(LS_SYMBOL);
    const savedPeriod = lsGet(LS_PERIOD);
    const savedMode = lsGet(LS_MODE);
    if (savedSymbol && quotes.some((q) => q.symbol === savedSymbol)) {
      setSymbol(savedSymbol);
    }
    if (savedPeriod && (PERIOD_IDS as string[]).includes(savedPeriod)) {
      setPeriod(savedPeriod as StockPeriod);
    }
    if (savedMode && (MODES as string[]).includes(savedMode)) {
      setMode(savedMode as Mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const pickSymbol = useCallback((s: string) => {
    setSymbol(s);
    lsSet(LS_SYMBOL, s);
  }, []);
  const pickPeriod = useCallback((p: StockPeriod) => {
    setPeriod(p);
    lsSet(LS_PERIOD, p);
  }, []);
  const pickMode = useCallback((m: Mode) => {
    setMode(m);
    lsSet(LS_MODE, m);
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    load(symbol, period);
  }, [symbol, period, load]);

  useEffect(() => {
    const id = setInterval(() => load(symbol, period, true), 15000);
    return () => clearInterval(id);
  }, [symbol, period, load]);

  const active = useMemo(
    () => quotes.find((q) => q.symbol === symbol) ?? quotes[0] ?? null,
    [quotes, symbol],
  );

  const updatedLabel = updatedAt
    ? new Intl.DateTimeFormat("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Taipei",
      }).format(updatedAt)
    : "—";

  return (
    <div className="stk-wrap">
      <div className="stk-main">
        {/* 標頭：選定個股報價 */}
        {active && (
          <div className="stk-head">
            <div className="stk-head-id">
              <span className="stk-symbol">{active.symbol}</span>
              <span className="stk-name">{active.name}</span>
              {active.typeLabel && <span className="stk-tag">{active.typeLabel}</span>}
            </div>
            <div className="stk-head-price" style={{ color: colorFor(active.changePct) }}>
              <span className="stk-price">{fmtPrice(active.price)}</span>
              <span className="stk-delta">
                {active.change >= 0 ? "+" : ""}
                {fmtPrice(active.change)} ({fmtPct(active.changePct)})
              </span>
            </div>
          </div>
        )}

        {/* 控制列 */}
        <div className="stk-controls">
          <div className="stk-seg">
            {PERIOD_TABS.map((p) => (
              <button
                key={p.id}
                className={`stk-seg-btn${period === p.id ? " is-on" : ""}`}
                onClick={() => pickPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="stk-seg">
            <button
              className={`stk-seg-btn${mode === "line" ? " is-on" : ""}`}
              onClick={() => pickMode("line")}
            >
              折線
            </button>
            <button
              className={`stk-seg-btn${mode === "candle" ? " is-on" : ""}`}
              onClick={() => pickMode("candle")}
            >
              K 線
            </button>
          </div>
          <span className="stk-updated">
            {loading ? "更新中…" : `更新於 ${updatedLabel}`}
          </span>
        </div>

        {/* 圖表 */}
        <div className="stk-chart">
          {series ? (
            <Chart series={series} mode={mode} />
          ) : (
            <div className="stk-chart-empty">尚無走勢資料 📭</div>
          )}
        </div>

        {/* 期間統計 */}
        {series?.stat && (
          <div className="stk-stats">
            <div className="stk-stat">
              <span className="stk-stat-l">期間開</span>
              <span className="stk-stat-v">{fmtPrice(series.stat.open)}</span>
            </div>
            <div className="stk-stat">
              <span className="stk-stat-l">最高</span>
              <span className="stk-stat-v">{fmtPrice(series.stat.high)}</span>
            </div>
            <div className="stk-stat">
              <span className="stk-stat-l">最低</span>
              <span className="stk-stat-v">{fmtPrice(series.stat.low)}</span>
            </div>
            <div className="stk-stat">
              <span className="stk-stat-l">期間漲跌</span>
              <span className="stk-stat-v" style={{ color: colorFor(series.stat.changePct) }}>
                {fmtPct(series.stat.changePct)}
              </span>
            </div>
            {active && (
              <div className="stk-stat">
                <span className="stk-stat-l">市場情緒</span>
                <span className="stk-stat-v">
                  {SENTIMENT_LABEL[active.sentiment] ?? active.sentiment}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 自選清單 */}
      <aside className="stk-watch">
        <div className="stk-watch-head">
          <span>指數 / 個股</span>
          <span className="stk-watch-cols">最新 · 漲跌%</span>
        </div>
        <ul className="stk-watch-list">
          {quotes.map((q) => (
            <li key={q.symbol}>
              <button
                className={`stk-watch-row${q.symbol === symbol ? " is-on" : ""}`}
                onClick={() => pickSymbol(q.symbol)}
              >
                <span className="stk-watch-id">
                  <span className="stk-watch-sym">{q.symbol}</span>
                  <span className="stk-watch-name">{q.name}</span>
                </span>
                <span className="stk-watch-nums">
                  <span className="stk-watch-price">{fmtPrice(q.price)}</span>
                  <span className="stk-watch-pct" style={{ color: colorFor(q.changePct) }}>
                    {fmtPct(q.changePct)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="stk-note">
          -# 每 15 秒自動更新；股價每 1 分鐘結算一次並隨成交推動。開市 09:00–21:00。
        </p>
      </aside>
    </div>
  );
}
