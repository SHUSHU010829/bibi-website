import Link from "next/link";
import { checkAdmin } from "@/lib/admin/permissions";
import { fetchStats } from "@/lib/admin/donation";
import { DONATION_TIERS } from "@/lib/donation/tiers";
import { DonationHead } from "../_components/SubNav";

export const dynamic = "force-dynamic";

const PLATFORM_LABEL: Record<string, string> = {
  ecpay: "綠界",
  opay: "歐付寶",
};

const TIER_LABEL: Record<string, string> = Object.fromEntries(
  DONATION_TIERS.map((t) => [t.id, `${t.emoji} ${t.name}`]),
);

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

function asStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const RANGES: { id: "30d" | "90d" | "365d" | "all"; label: string }[] = [
  { id: "30d", label: "近 30 天" },
  { id: "90d", label: "近 90 天" },
  { id: "365d", label: "近 1 年" },
  { id: "all", label: "全部時間" },
];

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await checkAdmin();
  if (result.status !== "ok") return null;

  const params = await searchParams;
  const rangeParam = asStr(params.range);
  const range = (RANGES.find((r) => r.id === rangeParam)?.id ?? "30d") as
    | "30d"
    | "90d"
    | "365d"
    | "all";

  const stats = await fetchStats(result.identity.userId, range);

  return (
    <>
      <DonationHead active="stats" />

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">贊助統計</span>
          <span className="d-greeting-name">
            {RANGES.find((r) => r.id === range)?.label}
          </span>
        </div>
      </div>

      <div className="d-tx-filters">
        <div className="d-tx-filter-group">
          <span className="d-tx-filter-lab">期間</span>
          <div className="d-pill-row">
            {RANGES.map((r) => (
              <Link
                key={r.id}
                href={`/admin/donation/stats?range=${r.id}`}
                className={"d-pill" + (range === r.id ? " active" : "")}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="d-grid-3">
        <div className="d-card d-card-feature">
          <div className="d-c-head">
            <div>
              <div className="d-c-title">總金額</div>
              <div className="d-c-sub">TOTAL</div>
            </div>
          </div>
          <div className="d-card-body">
            <div className="d-num-xl">NT$ {fmt(stats.totalAmount)}</div>
            <div className="d-feature-meta">
              共 {fmt(stats.count)} 筆 · 平均 NT$ {fmt(stats.avgAmount)}
            </div>
          </div>
        </div>
        <div className="d-card">
          <div className="d-c-head">
            <div>
              <div className="d-c-title">不重複贊助者</div>
              <div className="d-c-sub">PATRONS</div>
            </div>
          </div>
          <div className="d-card-body">
            <div className="d-num-xl">{fmt(stats.uniquePatrons)}</div>
            <div className="d-kbd">人</div>
          </div>
        </div>
        <div className="d-card">
          <div className="d-c-head">
            <div>
              <div className="d-c-title">未處理 unmatched</div>
              <div className="d-c-sub">PENDING</div>
            </div>
          </div>
          <div className="d-card-body">
            <div
              className={
                "d-num-xl " +
                (stats.pendingUnmatched > 0 ? "d-tx-neg" : "d-tx-pos")
              }
            >
              {fmt(stats.pendingUnmatched)}
            </div>
            <div className="d-kbd">
              <Link href="/admin/donation/unmatched?status=pending">前往處理 →</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="d-grid-2-eq">
        <div className="d-card">
          <div className="d-c-head">
            <div>
              <div className="d-c-title">平台分佈</div>
              <div className="d-c-sub">BY PLATFORM</div>
            </div>
          </div>
          <div className="d-row-list">
            {stats.byPlatform.length === 0 ? (
              <div className="d-list-row">
                <span className="d-list-key">—</span>
              </div>
            ) : (
              stats.byPlatform.map((p) => (
                <div key={p.platform} className="d-list-row">
                  <span className="d-list-key">
                    {PLATFORM_LABEL[p.platform] ?? p.platform}
                  </span>
                  <span className="d-list-val">
                    NT$ {fmt(p.amount)} · {fmt(p.count)} 筆
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="d-card">
          <div className="d-c-head">
            <div>
              <div className="d-c-title">方案分佈</div>
              <div className="d-c-sub">BY TIER</div>
            </div>
          </div>
          <div className="d-row-list">
            {stats.byTier.length === 0 ? (
              <div className="d-list-row">
                <span className="d-list-key">—</span>
              </div>
            ) : (
              stats.byTier.map((t) => (
                <div key={String(t.tierId)} className="d-list-row">
                  <span className="d-list-key">
                    {t.tierId
                      ? TIER_LABEL[t.tierId] ?? t.tierId
                      : "（未對應方案）"}
                  </span>
                  <span className="d-list-val">
                    NT$ {fmt(t.amount)} · {fmt(t.count)} 筆
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
