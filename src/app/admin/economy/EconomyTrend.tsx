"use client";

import Link from "next/link";
import { useState } from "react";
import type { EconomySnapshotPoint } from "@/lib/admin/economy";

const RANGES = [7, 30, 90] as const;

function fmt(n: number): string {
  return Math.round(n).toLocaleString("zh-TW");
}

// 軸標籤用緊湊格式（1.2k / 3.4M），避免長數字擠在一起
function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function fmtPct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)}%`;
}

function shortDate(iso: string): string {
  // "2026-06-24" → "6/24"
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

const VIEW_W = 720;
const VIEW_H = 190;
const PAD = { l: 10, r: 10, t: 14, b: 20 };
const PLOT_W = VIEW_W - PAD.l - PAD.r;
const PLOT_H = VIEW_H - PAD.t - PAD.b;

function xAt(i: number, n: number): number {
  if (n <= 1) return PAD.l + PLOT_W / 2;
  return PAD.l + (i / (n - 1)) * PLOT_W;
}

type Series = { label: string; color: string; values: number[] };

// 折線圖：可疊多條線，附 hover 垂直導引線 + tooltip
function LineChart({
  dates,
  series,
  formatValue,
}: {
  dates: string[];
  series: Series[];
  formatValue: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = dates.length;

  const allValues = series.flatMap((s) => s.values);
  let min = Math.min(...allValues);
  let max = Math.max(...allValues);
  if (min === max) {
    // 全平線：給一點上下空間，避免除以 0
    const pad = Math.abs(max) || 1;
    min -= pad;
    max += pad;
  }
  const yAt = (v: number) =>
    PAD.t + PLOT_H - ((v - min) / (max - min)) * PLOT_H;

  const paths = series.map((s) => {
    const d = s.values
      .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i, n).toFixed(1)},${yAt(v).toFixed(1)}`)
      .join(" ");
    return { ...s, d };
  });

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const i = Math.round(((rel - PAD.l) / PLOT_W) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  const hx = hover !== null ? xAt(hover, n) : 0;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        style={{ width: "100%", display: "block", touchAction: "none" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* 上下軸線 */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + PLOT_H} stroke="var(--line)" strokeWidth="1" />
        <line
          x1={PAD.l}
          y1={PAD.t + PLOT_H}
          x2={PAD.l + PLOT_W}
          y2={PAD.t + PLOT_H}
          stroke="var(--line)"
          strokeWidth="1"
        />
        {/* y 軸 min / max 標籤 */}
        <text x={PAD.l + 2} y={PAD.t + 9} fill="var(--ink-4)" fontSize="10" fontFamily="var(--mono)">
          {compact(max)}
        </text>
        <text x={PAD.l + 2} y={PAD.t + PLOT_H - 2} fill="var(--ink-4)" fontSize="10" fontFamily="var(--mono)">
          {compact(min)}
        </text>
        {paths.map((p) => (
          <path key={p.label} d={p.d} fill="none" stroke={p.color} strokeWidth="2" strokeLinejoin="round" />
        ))}
        {hover !== null && (
          <>
            <line x1={hx} y1={PAD.t} x2={hx} y2={PAD.t + PLOT_H} stroke="var(--ink-4)" strokeWidth="1" strokeDasharray="3 3" />
            {series.map((s) => (
              <circle key={s.label} cx={hx} cy={yAt(s.values[hover])} r="3.5" fill={s.color} stroke="var(--paper)" strokeWidth="1.5" />
            ))}
          </>
        )}
        {/* x 軸首尾日期 */}
        <text x={PAD.l} y={VIEW_H - 5} fill="var(--ink-4)" fontSize="10" fontFamily="var(--mono)">
          {n > 0 ? shortDate(dates[0]) : ""}
        </text>
        <text x={PAD.l + PLOT_W} y={VIEW_H - 5} fill="var(--ink-4)" fontSize="10" fontFamily="var(--mono)" textAnchor="end">
          {n > 0 ? shortDate(dates[n - 1]) : ""}
        </text>
      </svg>
      {hover !== null && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${(hx / VIEW_W) * 100}%`,
            transform: `translateX(${hover > n / 2 ? "-100%" : "0"})`,
            marginLeft: hover > n / 2 ? -8 : 8,
            background: "var(--paper-3)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "6px 9px",
            fontSize: 11,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 2,
          }}
        >
          <div style={{ color: "var(--ink-3)", fontFamily: "var(--mono)", marginBottom: 2 }}>
            {dates[hover]}
          </div>
          {series.map((s) => (
            <div key={s.label} style={{ color: "var(--ink-2)" }}>
              <span style={{ color: s.color }}>●</span> {s.label}：{formatValue(s.values[hover])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 印幣 / 銷幣分流長條圖：印幣向上（綠）、銷幣向下（紅），淨流動折線疊上
function FlowChart({
  dates,
  minted,
  burned,
  net,
}: {
  dates: string[];
  minted: number[];
  burned: number[];
  net: number[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = dates.length;
  const mag = Math.max(1, ...minted, ...burned);
  const zeroY = PAD.t + PLOT_H / 2;
  const halfH = PLOT_H / 2;
  const barW = Math.max(1.5, (PLOT_W / Math.max(n, 1)) * 0.6);

  const netMax = Math.max(1, ...net.map((v) => Math.abs(v)));
  const netY = (v: number) => zeroY - (v / netMax) * halfH * 0.9;
  const netPath = net
    .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i, n).toFixed(1)},${netY(v).toFixed(1)}`)
    .join(" ");

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const i = Math.round(((rel - PAD.l) / PLOT_W) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  const hx = hover !== null ? xAt(hover, n) : 0;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        style={{ width: "100%", display: "block", touchAction: "none" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <line x1={PAD.l} y1={zeroY} x2={PAD.l + PLOT_W} y2={zeroY} stroke="var(--line)" strokeWidth="1" />
        {dates.map((_, i) => {
          const x = xAt(i, n);
          const mH = (minted[i] / mag) * halfH * 0.92;
          const bH = (burned[i] / mag) * halfH * 0.92;
          return (
            <g key={i}>
              <rect x={x - barW / 2} y={zeroY - mH} width={barW} height={mH} fill="#7bbf6a" opacity="0.85" />
              <rect x={x - barW / 2} y={zeroY} width={barW} height={bH} fill="#d96a6a" opacity="0.85" />
            </g>
          );
        })}
        <path d={netPath} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
        <text x={PAD.l + 2} y={PAD.t + 9} fill="#7bbf6a" fontSize="10" fontFamily="var(--mono)">
          印 {compact(mag)}
        </text>
        <text x={PAD.l + 2} y={PAD.t + PLOT_H - 2} fill="#d96a6a" fontSize="10" fontFamily="var(--mono)">
          銷 {compact(mag)}
        </text>
        {hover !== null && (
          <line x1={hx} y1={PAD.t} x2={hx} y2={PAD.t + PLOT_H} stroke="var(--ink-4)" strokeWidth="1" strokeDasharray="3 3" />
        )}
        <text x={PAD.l} y={VIEW_H - 5} fill="var(--ink-4)" fontSize="10" fontFamily="var(--mono)">
          {n > 0 ? shortDate(dates[0]) : ""}
        </text>
        <text x={PAD.l + PLOT_W} y={VIEW_H - 5} fill="var(--ink-4)" fontSize="10" fontFamily="var(--mono)" textAnchor="end">
          {n > 0 ? shortDate(dates[n - 1]) : ""}
        </text>
      </svg>
      {hover !== null && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${(hx / VIEW_W) * 100}%`,
            transform: `translateX(${hover > n / 2 ? "-100%" : "0"})`,
            marginLeft: hover > n / 2 ? -8 : 8,
            background: "var(--paper-3)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: "6px 9px",
            fontSize: 11,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 2,
          }}
        >
          <div style={{ color: "var(--ink-3)", fontFamily: "var(--mono)", marginBottom: 2 }}>
            {dates[hover]}
          </div>
          <div style={{ color: "#7bbf6a" }}>● 印幣 +{fmt(minted[hover])}</div>
          <div style={{ color: "#d96a6a" }}>● 銷幣 −{fmt(burned[hover])}</div>
          <div style={{ color: "var(--ink-2)" }}>淨流動 {net[hover] >= 0 ? "+" : "−"}{fmt(Math.abs(net[hover]))}</div>
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  sub,
  legend,
  children,
}: {
  title: string;
  sub: string;
  legend?: { label: string; color: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="d-card" style={{ marginBottom: 16 }}>
      <div className="d-c-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div className="d-c-title">{title}</div>
          <div className="d-c-sub">{sub}</div>
        </div>
        {legend && (
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--ink-3)" }}>
            {legend.map((l) => (
              <span key={l.label}>
                <span style={{ color: l.color }}>●</span> {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="d-card-body">{children}</div>
    </div>
  );
}

export function EconomyTrend({
  range,
  snapshots,
  baseQuery,
}: {
  range: number;
  snapshots: EconomySnapshotPoint[];
  baseQuery: string;
}) {
  const dates = snapshots.map((s) => s.date);
  const circ = snapshots.map((s) => s.totalCirculation);
  const wallet = snapshots.map((s) => s.totalWalletCoins);
  const deposit = snapshots.map((s) => s.totalDepositPrincipal);
  const minted = snapshots.map((s) => s.flow?.mintedTotal ?? 0);
  const burned = snapshots.map((s) => s.flow?.burnedTotal ?? 0);
  const net = snapshots.map((s) => s.flow?.netFlow ?? 0);
  const top10 = snapshots.map((s) => s.concentration?.top10Share ?? 0);
  const hasConcentration = snapshots.some((s) => s.concentration);

  return (
    <>
      <div className="d-section-title">
        <h2>經濟趨勢</h2>
        <span className="d-section-en">TRENDS</span>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "4px 4px 14px" }}>
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin/economy?range=${r}${baseQuery}`}
            className={`d-btn ${r === range ? "d-btn-discord" : "d-btn-ghost"}`}
            scroll={false}
          >
            近 {r} 天
          </Link>
        ))}
      </div>

      {snapshots.length < 2 ? (
        <div className="d-empty">
          趨勢圖需要至少 2 天的每日快照（00:05 凍結，永久保留）。
          {snapshots.length === 1
            ? `目前已累積 1 天（${dates[0]}），明天起就會開始連線。`
            : "目前尚無快照資料，scheduler 開跑後每天累積一筆。"}
        </div>
      ) : (
        <>
          {snapshots.length < range && (
            <p className="d-notice" style={{ marginTop: 0 }}>
              快照僅自 {dates[0]} 起累積，目前 {snapshots.length} 天（不足 {range} 天）。
              滿 {range} 天前只顯示已累積區間——快照無法回溯部署前的歷史。
            </p>
          )}

          <ChartCard
            title="流通量趨勢"
            sub="CIRCULATION"
            legend={[
              { label: "總流通", color: "var(--accent)" },
              { label: "錢包", color: "#6fa8dc" },
              { label: "存款", color: "#c9a26b" },
            ]}
          >
            <LineChart
              dates={dates}
              series={[
                { label: "總流通", color: "var(--accent)", values: circ },
                { label: "錢包", color: "#6fa8dc", values: wallet },
                { label: "存款", color: "#c9a26b", values: deposit },
              ]}
              formatValue={fmt}
            />
          </ChartCard>

          <ChartCard
            title="每日印幣 / 銷幣"
            sub="MINT vs BURN"
            legend={[
              { label: "印幣", color: "#7bbf6a" },
              { label: "銷幣", color: "#d96a6a" },
              { label: "淨流動", color: "var(--accent)" },
            ]}
          >
            <FlowChart dates={dates} minted={minted} burned={burned} net={net} />
          </ChartCard>

          {hasConcentration && (
            <ChartCard title="持幣集中度（Top 10 占比）" sub="CONCENTRATION">
              <LineChart
                dates={dates}
                series={[{ label: "Top 10 占比", color: "#cd8de0", values: top10 }]}
                formatValue={(v) => fmtPct(v)}
              />
            </ChartCard>
          )}
        </>
      )}
    </>
  );
}
