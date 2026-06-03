import Link from "next/link";

const TABS = [
  { id: "mining", label: "挖礦榜", href: "/leaderboard/mining" },
  { id: "titles", label: "稱號榜", href: "/leaderboard/titles" },
  { id: "guild", label: "公會榜", href: "/leaderboard/guild" },
  { id: "weekly", label: "週榜", href: "/leaderboard/weekly-summary" },
] as const;

export type LbTab = (typeof TABS)[number]["id"];

export function LeaderboardHead({ active }: { active: LbTab }) {
  return (
    <header className="d-page-head">
      <div className="d-page-head-left">
        <div className="d-tabs">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={"d-tab" + (active === t.id ? " active" : "")}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
