import {
  fetchGuildClubLeaderboard,
  leaderboardConfigured,
  type GuildClubRow,
} from "@/lib/leaderboard/api";
import { LeaderboardHead } from "../_components/SubNav";
import { fmt } from "../_components/LbRow";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const MEDAL = ["🥇", "🥈", "🥉"];

export default async function LeaderboardGuildPage() {
  if (!leaderboardConfigured()) return <Unconfigured />;

  const data = await fetchGuildClubLeaderboard(25);
  if ("unconfigured" in data) return <Unconfigured />;
  if ("error" in data) return <ErrorBlock msg={data.error} />;

  return (
    <>
      <LeaderboardHead active="guild" />

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">公會榜</span>
          <span className="d-greeting-name">依累積金庫排序</span>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="d-empty">這個伺服器還沒有公會，當第一個吧。</div>
      ) : (
        <ol className="d-lb-list">
          {data.rows.map((r, i) => (
            <GuildClubRowItem key={r.guildClubId} rank={i + 1} club={r} />
          ))}
        </ol>
      )}

      <p className="d-notice">
        累積金庫為公會歷史累積值（升級判定用）。可分配餘額為扣除升級成本後的當前金庫。
      </p>
    </>
  );
}

function GuildClubRowItem({ rank, club }: { rank: number; club: GuildClubRow }) {
  const isTop3 = rank <= 3;
  return (
    <li className={"d-lb-row" + (isTop3 ? " d-lb-row-top" : "")}>
      <span className="d-lb-rank">{isTop3 ? MEDAL[rank - 1] : `#${rank}`}</span>
      <div className="d-lb-avatar d-lb-avatar-fallback" aria-hidden>
        🏰
      </div>
      <span className="d-lb-name">
        <span className="d-lb-name-display">{club.name}</span>
        <span className="d-lb-name-sub">
          Lv.{club.level} · {club.memberCount}/{club.maxMembers} 人 · 餘額{" "}
          {fmt(club.treasuryCurrent)}
        </span>
      </span>
      <span className="d-lb-value">
        <span className="d-lb-value-num">{fmt(club.treasury)}</span>
        <span className="d-lb-value-unit">幣</span>
      </span>
    </li>
  );
}

function Unconfigured() {
  return (
    <>
      <LeaderboardHead active="guild" />
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
      <LeaderboardHead active="guild" />
      <div className="d-empty d-tx-neg">{msg}</div>
    </>
  );
}
