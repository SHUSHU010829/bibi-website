import Link from "next/link";
import {
  fetchWeeklySummary,
  leaderboardConfigured,
  type MiningCountRow,
  type MiningValueRow,
  type TitleRow,
} from "@/lib/leaderboard/api";
import { LeaderboardHead } from "../_components/SubNav";
import { LbRowItem, fmt } from "../_components/LbRow";

export const dynamic = "force-dynamic";
export const revalidate = 300;

function fmtReset(epoch: number): string {
  return new Date(epoch * 1000).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function WeeklySummaryPage() {
  if (!leaderboardConfigured()) {
    return (
      <>
        <LeaderboardHead active="weekly" />
        <div className="d-empty">排行榜尚未設定。</div>
      </>
    );
  }
  const data = await fetchWeeklySummary(10);
  if ("unconfigured" in data) {
    return (
      <>
        <LeaderboardHead active="weekly" />
        <div className="d-empty">排行榜尚未設定。</div>
      </>
    );
  }
  if ("error" in data) {
    return (
      <>
        <LeaderboardHead active="weekly" />
        <div className="d-empty d-tx-neg">{data.error}</div>
      </>
    );
  }

  return (
    <>
      <LeaderboardHead active="weekly" />

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">本週榜</span>
          <span className="d-greeting-name">
            下次重置 {fmtReset(data.resetEpoch)}
          </span>
        </div>
      </div>

      <Section title="⛏️ 本週挖礦數量" emptyHint="本週還沒有人挖礦">
        {data.mining.length === 0 ? null : (
          <ol className="d-lb-list">
            {data.mining.map((r: MiningCountRow, i) => (
              <LbRowItem
                key={r.userId}
                rank={i + 1}
                displayName={r.displayName}
                avatar={r.avatar}
                value={fmt(r.total)}
                unit="顆"
                sub={`${r.count} 次挖礦`}
              />
            ))}
          </ol>
        )}
      </Section>

      <Section title="💎 本週礦石市值" emptyHint="本週還沒有人賣得出市值">
        {data.value.length === 0 ? null : (
          <ol className="d-lb-list">
            {data.value.map((r: MiningValueRow, i) => (
              <LbRowItem
                key={r.userId}
                rank={i + 1}
                displayName={r.displayName}
                avatar={r.avatar}
                value={fmt(r.value)}
                unit="幣"
              />
            ))}
          </ol>
        )}
      </Section>

      <Section title="🏆 稱號收藏" emptyHint="還沒有人解鎖稱號">
        {data.titles.length === 0 ? null : (
          <ol className="d-lb-list">
            {data.titles.map((r: TitleRow, i) => (
              <LbRowItem
                key={r.userId}
                rank={i + 1}
                displayName={r.displayName}
                avatar={r.avatar}
                value={fmt(r.titleCount)}
                unit="個稱號"
              />
            ))}
          </ol>
        )}
      </Section>

      <p className="d-notice">
        週榜每 5 分鐘更新；想看完整 20 名榜單請去{" "}
        <Link href="/leaderboard/mining">挖礦榜</Link> 與{" "}
        <Link href="/leaderboard/titles">稱號榜</Link>。
      </p>
    </>
  );
}

function Section({
  title,
  emptyHint,
  children,
}: {
  title: string;
  emptyHint: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="d-section-title">
        <h2>{title}</h2>
      </div>
      {children ?? <div className="d-empty">{emptyHint}</div>}
    </>
  );
}
