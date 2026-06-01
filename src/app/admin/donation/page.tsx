import Link from "next/link";
import { checkAdmin } from "@/lib/admin/permissions";
import { fetchRecords, type DonationRecord } from "@/lib/admin/donation";
import { DONATION_TIERS } from "@/lib/donation/tiers";
import { fmtDateTime } from "@/lib/format/time";
import { DonationHead } from "./_components/SubNav";

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

function fmtTime(s: string): string {
  return fmtDateTime(s);
}

function asStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function AdminDonationRecordsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await checkAdmin();
  if (result.status !== "ok") return null;

  const params = await searchParams;
  const page = Math.max(0, Number(asStr(params.page) ?? "0") || 0);
  const platform =
    asStr(params.platform) === "ecpay" || asStr(params.platform) === "opay"
      ? (asStr(params.platform) as "ecpay" | "opay")
      : undefined;
  const granted =
    asStr(params.granted) === "true" || asStr(params.granted) === "false"
      ? (asStr(params.granted) as "true" | "false")
      : undefined;

  const data = await fetchRecords(result.identity.userId, {
    page,
    pageSize: 25,
    platform,
    granted,
  });

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <>
      <DonationHead active="records" />

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">贊助紀錄</span>
          <span className="d-greeting-name">共 {fmt(data.total)} 筆</span>
        </div>
      </div>

      <div className="d-tx-filters">
        <FilterGroup label="平台">
          <FilterPill href={buildQuery({ platform: undefined })} active={!platform}>
            全部
          </FilterPill>
          <FilterPill
            href={buildQuery({ platform: "ecpay" })}
            active={platform === "ecpay"}
          >
            綠界
          </FilterPill>
          <FilterPill
            href={buildQuery({ platform: "opay" })}
            active={platform === "opay"}
          >
            歐付寶
          </FilterPill>
        </FilterGroup>
        <FilterGroup label="發放狀態">
          <FilterPill href={buildQuery({ granted: undefined })} active={!granted}>
            全部
          </FilterPill>
          <FilterPill
            href={buildQuery({ granted: "true" })}
            active={granted === "true"}
          >
            已發放
          </FilterPill>
          <FilterPill
            href={buildQuery({ granted: "false" })}
            active={granted === "false"}
          >
            未發放
          </FilterPill>
        </FilterGroup>
      </div>

      {data.rows.length === 0 ? (
        <div className="d-empty">沒有符合條件的紀錄。</div>
      ) : (
        <RecordsTable rows={data.rows} />
      )}

      {totalPages > 1 && (
        <Pager
          page={data.page}
          totalPages={totalPages}
          build={(p) => buildQuery({ page: p }, params)}
        />
      )}
    </>
  );

  function buildQuery(
    overrides: Partial<{
      platform: "ecpay" | "opay" | undefined;
      granted: "true" | "false" | undefined;
      page: number;
    }>,
    base?: Record<string, string | string[] | undefined>,
  ): string {
    const merged = {
      platform:
        overrides.platform !== undefined ? overrides.platform : platform,
      granted: overrides.granted !== undefined ? overrides.granted : granted,
      page: overrides.page ?? (base ? page : 0),
    };
    const sp = new URLSearchParams();
    if (merged.platform) sp.set("platform", merged.platform);
    if (merged.granted) sp.set("granted", merged.granted);
    if (merged.page && merged.page > 0) sp.set("page", String(merged.page));
    const qs = sp.toString();
    return qs ? `/admin/donation?${qs}` : "/admin/donation";
  }
}

function FilterGroup({
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

function FilterPill({
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

function RecordsTable({ rows }: { rows: DonationRecord[] }) {
  return (
    <div className="d-table-wrap">
      <table className="d-tbl">
        <thead>
          <tr>
            <th>時間</th>
            <th>玩家 ID</th>
            <th>方案</th>
            <th>平台</th>
            <th>tradeNo</th>
            <th>發放狀態</th>
            <th className="num">金額</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.tradeNo}>
              <td>{fmtTime(r.grantedAt)}</td>
              <td className="mono">{r.userId}</td>
              <td>{r.tierId ? TIER_LABEL[r.tierId] ?? r.tierId : "—"}</td>
              <td>{PLATFORM_LABEL[r.platform] ?? r.platform}</td>
              <td className="mono">{r.tradeNo}</td>
              <td>
                <GrantStatus r={r} />
              </td>
              <td className="num">NT$ {fmt(r.amountNtd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GrantStatus({ r }: { r: DonationRecord }) {
  const flags: { k: keyof DonationRecord; label: string }[] = [
    { k: "coinsGranted", label: "幣" },
    { k: "roleGranted", label: "Role" },
    { k: "itemsGranted", label: "道具" },
    { k: "buffGranted", label: "Buff" },
    { k: "themeGranted", label: "卡面" },
    { k: "titleGranted", label: "稱號" },
  ];
  const expected = flags.filter((f) => {
    // 如果整個 record 都沒有對應 perks 就不顯示該欄
    return r[f.k] !== undefined;
  });
  return (
    <span className="mono" style={{ fontSize: 12 }}>
      {expected.map((f) => (
        <span
          key={f.k}
          style={{
            marginRight: 6,
            color: r[f.k] ? "var(--accent-2)" : "var(--ink-4)",
          }}
        >
          {r[f.k] ? "✓" : "·"}
          {f.label}
        </span>
      ))}
    </span>
  );
}

function Pager({
  page,
  totalPages,
  build,
}: {
  page: number;
  totalPages: number;
  build: (p: number) => string;
}) {
  return (
    <div className="d-pager">
      {page > 0 ? (
        <Link className="d-btn" href={build(page - 1)}>
          ← 較新
        </Link>
      ) : (
        <span className="d-btn d-btn-disabled">← 較新</span>
      )}
      <span className="d-pager-page">
        第 {page + 1} / {totalPages} 頁
      </span>
      {page + 1 < totalPages ? (
        <Link className="d-btn" href={build(page + 1)}>
          較舊 →
        </Link>
      ) : (
        <span className="d-btn d-btn-disabled">較舊 →</span>
      )}
    </div>
  );
}
