import {
  fetchTitleLeaderboard,
  leaderboardConfigured,
} from "@/lib/leaderboard/api";
import { LeaderboardHead } from "../_components/SubNav";
import { LbRowItem, fmt } from "../_components/LbRow";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function LeaderboardTitlesPage() {
  if (!leaderboardConfigured()) {
    return (
      <>
        <LeaderboardHead active="titles" />
        <div className="d-empty">
          排行榜尚未設定。
        </div>
      </>
    );
  }

  const data = await fetchTitleLeaderboard(20);
  if ("unconfigured" in data) {
    return (
      <>
        <LeaderboardHead active="titles" />
        <div className="d-empty">排行榜尚未設定。</div>
      </>
    );
  }
  if ("error" in data) {
    return (
      <>
        <LeaderboardHead active="titles" />
        <div className="d-empty d-tx-neg">{data.error}</div>
      </>
    );
  }

  return (
    <>
      <LeaderboardHead active="titles" />

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">稱號榜</span>
          <span className="d-greeting-name">稀有稱號收藏家</span>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="d-empty">還沒有人解鎖任何稱號。</div>
      ) : (
        <ol className="d-lb-list">
          {data.rows.map((r, i) => (
            <LbRowItem
              key={r.userId}
              rank={i + 1}
              userId={r.userId}
              displayName={r.displayName}
              avatar={r.avatar}
              anonymous={r.anonymous}
              value={fmt(r.titleCount)}
              unit="個稱號"
            />
          ))}
        </ol>
      )}

      <p className="d-notice">
        稱號透過挖礦、釣魚、地下城、賭場、贊助等各種成就解鎖。
        詳細稱號列表用 Discord <code>/稱號</code>。
      </p>
    </>
  );
}
