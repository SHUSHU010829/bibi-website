import Link from "next/link";
import { checkAdmin } from "@/lib/admin/permissions";
import {
  searchMembers,
  fetchUserSummary,
  type UserSummary,
} from "@/lib/admin/economy";
import { AdminApiError } from "@/lib/admin/fetcher";
import { fmtShortDateTime } from "@/lib/format/time";
import { AdjustForm } from "./AdjustForm";

export const dynamic = "force-dynamic";

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

function fmtTime(s: string): string {
  return fmtShortDateTime(s);
}

function asStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function AdminEconomyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await checkAdmin();
  if (admin.status !== "ok") return null;

  const params = await searchParams;
  const q = asStr(params.q) ?? "";
  const targetId = asStr(params.id) ?? "";

  let summary: UserSummary | null = null;
  let summaryError: string | null = null;
  if (targetId) {
    try {
      summary = await fetchUserSummary(admin.identity.userId, targetId);
    } catch (err) {
      summaryError =
        err instanceof AdminApiError
          ? `bot ${err.status}：${err.message}`
          : String(err);
    }
  }

  const search = q ? await searchMembers(admin.identity.userId, q) : null;

  return (
    <>
      <header className="d-page-head">
        <div className="d-page-head-left">
          <span className="d-crumb">/ admin / economy</span>
        </div>
      </header>

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">經濟管理</span>
          <span className="d-greeting-name">調整金幣 / XP</span>
        </div>
      </div>

      <form method="get" className="d-search-form">
        <input
          name="q"
          defaultValue={q}
          placeholder="搜尋玩家：Discord ID 或 username / 暱稱"
          className="d-resolve-input"
        />
        <button type="submit" className="d-btn d-btn-discord">
          搜尋
        </button>
      </form>

      {search && (
        <SearchResults rows={search.rows} q={q} />
      )}

      {targetId && summaryError && (
        <div className="d-empty d-tx-neg">{summaryError}</div>
      )}

      {summary && <UserDetail summary={summary} />}

      <p className="d-notice">
        所有調整都會寫 CoinTransactions（source = admin）、寫稽核日誌 90 天保留。
        理由必填 ≥ 5 字。
      </p>
    </>
  );
}

function SearchResults({
  rows,
  q,
}: {
  rows: { userId: string; username: string; displayName: string; avatar: string }[];
  q: string;
}) {
  if (rows.length === 0) {
    return <div className="d-empty">「{q}」查無結果（cache 未含或不在伺服器）。</div>;
  }
  return (
    <>
      <div className="d-section-title">
        <h2>搜尋結果</h2>
        <span className="d-section-en">{rows.length} HITS</span>
      </div>
      <div className="d-search-results">
        {rows.map((r) => (
          <Link
            key={r.userId}
            href={`/admin/economy?id=${r.userId}`}
            className="d-search-hit"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.avatar}
              alt=""
              width={36}
              height={36}
              className="d-search-avatar"
            />
            <div className="d-search-meta">
              <span className="d-search-name">{r.displayName}</span>
              <span className="d-search-id mono">{r.username} · {r.userId}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function UserDetail({ summary }: { summary: UserSummary }) {
  const u = summary.user;
  return (
    <>
      <div className="d-section-title">
        <h2>玩家摘要</h2>
        <span className="d-section-en">SUMMARY</span>
      </div>

      <div className="d-card d-card-feature" style={{ marginBottom: 18 }}>
        <div
          className="d-c-head"
          style={{ display: "flex", alignItems: "center", gap: 14 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={u.avatar}
            alt=""
            width={48}
            height={48}
            style={{ borderRadius: "50%" }}
          />
          <div>
            <div className="d-c-title">{u.displayName}</div>
            <div className="d-c-sub mono">{u.username} · {u.userId}</div>
          </div>
        </div>
      </div>

      <div className="d-grid-3">
        <Stat title="金幣餘額" sub="BALANCE" value={fmt(summary.coin.balance)} />
        <Stat
          title="累積收入"
          sub="LIFETIME"
          value={fmt(summary.coin.lifetime)}
        />
        <Stat
          title="近 30 天淨"
          sub="LAST 30D"
          value={`${summary.last30Days.net >= 0 ? "+" : ""}${fmt(summary.last30Days.net)}`}
          accent={
            summary.last30Days.net >= 0 ? "d-tx-pos" : "d-tx-neg"
          }
        />
        <Stat title="等級" sub="LEVEL" value={String(summary.level.level)} />
        <Stat title="總 XP" sub="XP" value={fmt(summary.level.totalXp)} />
        <Stat title="連勝" sub="STREAK" value={`${summary.level.streak} 天`} />
      </div>

      <div className="d-section-title">
        <h2>調整金幣</h2>
        <span className="d-section-en">COIN ADJUST</span>
      </div>
      <AdjustForm userId={u.userId} kind="coin" />

      <div className="d-section-title">
        <h2>加 XP</h2>
        <span className="d-section-en">XP GRANT</span>
      </div>
      <AdjustForm userId={u.userId} kind="xp" />

      <div className="d-section-title">
        <h2>最近 10 筆金流</h2>
        <span className="d-section-en">RECENT TX</span>
      </div>
      {summary.recentTx.length === 0 ? (
        <div className="d-empty">沒有金流紀錄。</div>
      ) : (
        <div className="d-table-wrap">
          <table className="d-tbl">
            <thead>
              <tr>
                <th>時間</th>
                <th>來源</th>
                <th className="num">金額</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentTx.map((t, i) => (
                <tr key={`${t.createdAt}-${i}`}>
                  <td>{fmtTime(t.createdAt)}</td>
                  <td className="mono">{t.source}</td>
                  <td
                    className={
                      "num " + (t.amount >= 0 ? "d-tx-pos" : "d-tx-neg")
                    }
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {fmt(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Stat({
  title,
  sub,
  value,
  accent,
}: {
  title: string;
  sub: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="d-card">
      <div className="d-c-head">
        <div>
          <div className="d-c-title">{title}</div>
          <div className="d-c-sub">{sub}</div>
        </div>
      </div>
      <div className="d-card-body">
        <div className={"d-num-xl " + (accent ?? "")}>{value}</div>
      </div>
    </div>
  );
}
