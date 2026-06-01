import Link from "next/link";
import {
  fetchMiningLeaderboard,
  leaderboardConfigured,
  type MiningType,
  type Period,
  type MiningCountRow,
  type MiningValueRow,
  type MiningDiamondRow,
} from "@/lib/leaderboard/api";
import { LeaderboardHead } from "../_components/SubNav";
import { LbRowItem, fmt } from "../_components/LbRow";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const TYPE_TABS: { id: MiningType; label: string }[] = [
  { id: "count", label: "挖礦次數" },
  { id: "value", label: "礦石市值" },
  { id: "diamond", label: "鑽石收藏" },
];

const PERIOD_TABS: { id: Period; label: string }[] = [
  { id: "today", label: "今日" },
  { id: "week", label: "本週" },
  { id: "month", label: "本月" },
  { id: "all", label: "全部時間" },
];

function asStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function isMiningType(v: string | undefined): v is MiningType {
  return v === "count" || v === "value" || v === "diamond";
}
function isPeriod(v: string | undefined): v is Period {
  return v === "today" || v === "week" || v === "month" || v === "all";
}

export default async function LeaderboardMiningPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!leaderboardConfigured()) {
    return <Unconfigured />;
  }

  const params = await searchParams;
  const type: MiningType = isMiningType(asStr(params.type))
    ? (asStr(params.type) as MiningType)
    : "count";
  let period: Period = isPeriod(asStr(params.period))
    ? (asStr(params.period) as Period)
    : "week";
  if (type === "diamond") period = "all";

  const data = await fetchMiningLeaderboard(type, period, 20);
  if ("unconfigured" in data) return <Unconfigured />;
  if ("error" in data) return <ErrorBlock msg={data.error} />;

  return (
    <>
      <LeaderboardHead active="mining" />

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">挖礦榜</span>
          <span className="d-greeting-name">{labelOf(type)}</span>
        </div>
      </div>

      <div className="d-tx-filters">
        <PillGroup label="榜單">
          {TYPE_TABS.map((t) => (
            <Pill
              key={t.id}
              href={buildHref({ type: t.id, period: t.id === "diamond" ? "all" : period })}
              active={type === t.id}
            >
              {t.label}
            </Pill>
          ))}
        </PillGroup>
        {type !== "diamond" && (
          <PillGroup label="期間">
            {PERIOD_TABS.map((p) => (
              <Pill
                key={p.id}
                href={buildHref({ type, period: p.id })}
                active={period === p.id}
              >
                {p.label}
              </Pill>
            ))}
          </PillGroup>
        )}
      </div>

      {data.rows.length === 0 ? (
        <div className="d-empty">這個期間還沒有人上榜。</div>
      ) : (
        <ol className="d-lb-list">
          {data.rows.map((r, i) => (
            <LbRowItem
              key={r.userId}
              rank={i + 1}
              displayName={r.displayName}
              avatar={r.avatar}
              value={fmt(valueOf(type, r))}
              unit={unitOf(type)}
              sub={subOf(type, r)}
            />
          ))}
        </ol>
      )}

      <p className="d-notice">
        排名每分鐘更新一次。不想出現在榜上請用 Discord <code>/設定 公開資料</code>（B-Step 2 上線後可用）。
      </p>
    </>
  );
}

function labelOf(t: MiningType): string {
  return TYPE_TABS.find((x) => x.id === t)?.label ?? t;
}
function valueOf(
  t: MiningType,
  r: MiningCountRow | MiningValueRow | MiningDiamondRow,
): number {
  if (t === "value") return (r as MiningValueRow).value;
  if (t === "diamond") return (r as MiningDiamondRow).diamonds;
  return (r as MiningCountRow).total;
}
function unitOf(t: MiningType): string {
  return t === "value" ? "幣" : t === "diamond" ? "顆" : "顆";
}
function subOf(
  t: MiningType,
  r: MiningCountRow | MiningValueRow | MiningDiamondRow,
): string | null {
  if (t === "value" && "count" in r) return `${r.count} 次挖礦`;
  if (t === "count" && "count" in r) return `${r.count} 次挖礦`;
  return null;
}
function buildHref({ type, period }: { type: MiningType; period: Period }): string {
  const sp = new URLSearchParams();
  if (type !== "count") sp.set("type", type);
  if (period !== "week" && type !== "diamond") sp.set("period", period);
  const qs = sp.toString();
  return qs ? `/leaderboard/mining?${qs}` : "/leaderboard/mining";
}

function PillGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="d-tx-filter-group">
      <span className="d-tx-filter-lab">{label}</span>
      <div className="d-pill-row">{children}</div>
    </div>
  );
}
function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={"d-pill" + (active ? " active" : "")}>
      {children}
    </Link>
  );
}

function Unconfigured() {
  return (
    <>
      <LeaderboardHead active="mining" />
      <div className="d-empty">
        排行榜尚未設定（<code>BOT_API_BASE_URL</code> /{" "}
        <code>PRIMARY_GUILD_ID</code>）。
      </div>
    </>
  );
}

function ErrorBlock({ msg }: { msg: string }) {
  return (
    <>
      <LeaderboardHead active="mining" />
      <div className="d-empty d-tx-neg">{msg}</div>
    </>
  );
}
