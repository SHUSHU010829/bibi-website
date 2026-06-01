import Link from "next/link";
import { checkAdmin } from "@/lib/admin/permissions";
import { fetchPatrons } from "@/lib/admin/donation";
import { DONATION_TIERS } from "@/lib/donation/tiers";
import { fmtDate as fmtDateOnly } from "@/lib/format/time";
import { DonationHead } from "../_components/SubNav";

export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = Object.fromEntries(
  DONATION_TIERS.map((t) => [t.id, `${t.emoji} ${t.name}`]),
);

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

function fmtDate(s: string): string {
  return fmtDateOnly(s);
}

function asStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function AdminPatronsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await checkAdmin();
  if (result.status !== "ok") return null;

  const params = await searchParams;
  const sortParam = asStr(params.sort);
  const sort: "lifetime" | "recent" =
    sortParam === "recent" ? "recent" : "lifetime";
  const page = Math.max(0, Number(asStr(params.page) ?? "0") || 0);

  const data = await fetchPatrons(result.identity.userId, {
    sort,
    page,
    pageSize: 25,
  });

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <>
      <DonationHead active="patrons" />

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">贊助者</span>
          <span className="d-greeting-name">共 {fmt(data.total)} 人</span>
        </div>
      </div>

      <div className="d-tx-filters">
        <div className="d-tx-filter-group">
          <span className="d-tx-filter-lab">排序</span>
          <div className="d-pill-row">
            <Link
              href="/admin/donation/patrons?sort=lifetime"
              className={"d-pill" + (sort === "lifetime" ? " active" : "")}
            >
              累積金額
            </Link>
            <Link
              href="/admin/donation/patrons?sort=recent"
              className={"d-pill" + (sort === "recent" ? " active" : "")}
            >
              最近贊助
            </Link>
          </div>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="d-empty">還沒有任何贊助者。</div>
      ) : (
        <div className="d-table-wrap">
          <table className="d-tbl">
            <thead>
              <tr>
                <th>排名</th>
                <th>玩家 ID</th>
                <th>顯示名稱</th>
                <th>最後方案</th>
                <th className="num">累積</th>
                <th className="num">次數</th>
                <th>首次</th>
                <th>最近</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((p, i) => (
                <tr key={p.userId}>
                  <td className="mono">#{page * data.pageSize + i + 1}</td>
                  <td className="mono">{p.userId}</td>
                  <td>{p.lastPatronName || "—"}</td>
                  <td>
                    {p.lastTierId
                      ? TIER_LABEL[p.lastTierId] ?? p.lastTierId
                      : "—"}
                  </td>
                  <td className="num">NT$ {fmt(p.lifetimeAmount)}</td>
                  <td className="num">{fmt(p.donationCount)}</td>
                  <td>{fmtDate(p.firstDonation)}</td>
                  <td>{fmtDate(p.lastDonation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-pager">
          {page > 0 ? (
            <Link
              className="d-btn"
              href={`/admin/donation/patrons?sort=${sort}&page=${page - 1}`}
            >
              ← 上一頁
            </Link>
          ) : (
            <span className="d-btn d-btn-disabled">← 上一頁</span>
          )}
          <span className="d-pager-page">
            第 {page + 1} / {totalPages} 頁
          </span>
          {page + 1 < totalPages ? (
            <Link
              className="d-btn"
              href={`/admin/donation/patrons?sort=${sort}&page=${page + 1}`}
            >
              下一頁 →
            </Link>
          ) : (
            <span className="d-btn d-btn-disabled">下一頁 →</span>
          )}
        </div>
      )}
    </>
  );
}
