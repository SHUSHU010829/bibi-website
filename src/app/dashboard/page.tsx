import Link from "next/link";
import { readSession, avatarUrl } from "@/lib/donation/session";
import {
  getCoinSummary,
  getLevelSummary,
  getMiningSummary,
  getDonationHistory,
  getCoinHistory,
  getTaxHistory,
  getInviteStats,
  getDuelHistory,
  getLeaderboard,
  getLotteryDigest,
  getActiveBuffs,
  getBackpack,
  getEquipment,
  getQuestStatus,
  evaluateBadges,
  getPrimaryGuildId,
  COIN_SOURCE_LABELS,
  COIN_CATEGORIES,
  COIN_HISTORY_MAX_PAGE,
  LEADERBOARD_CATEGORIES,
  LOTTERY_TYPE_LABELS,
  type CoinSummary,
  type LevelSummary,
  type MiningSummary,
  type DonationHistoryItem,
  type CoinHistoryPage,
  type CoinHistoryPeriod,
  type CoinHistoryDirection,
  type TaxHistoryPeriod,
  type TaxHistorySummary,
  type InviteStats,
  type DuelHistorySummary,
  type LeaderboardKey,
  type LeaderboardResult,
  type LotteryDrawSummary,
  type ActiveBuff,
  type BackpackSummary,
  type EquipmentSummary,
  type QuestStatus,
  type QuestStateRow,
  type BadgeProgressRow,
} from "@/lib/dashboard/profile";
import {
  ORES,
  FISH,
  PICKAXES,
  RODS,
  WEAPONS,
  SHOP_ITEMS,
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  BADGE_CATEGORIES,
  DUNGEON_BASE_ATK,
  type BadgeCategory,
  type QuestDef,
} from "@/lib/dashboard/botDefs";
import { DONATION_TIERS } from "@/lib/donation/tiers";

export const dynamic = "force-dynamic";

const INVITE_URL = "https://discord.gg/shushu010829";

const PICKAXE_NAMES: Record<string, string> = {
  wood: "木鎬",
  iron: "鐵鎬",
  gold: "黃金鎬",
  diamond: "鑽石鎬",
};

const ROD_NAMES: Record<string, string> = {
  bamboo: "竹釣竿",
  carbon: "碳纖釣竿",
  gold: "黃金釣竿",
  mythril: "秘銀釣竿",
};

const ORE_NAMES: Record<string, { name: string; emoji: string }> = {
  stone: { name: "石頭", emoji: "🪨" },
  coal: { name: "煤炭", emoji: "🪵" },
  iron: { name: "鐵礦", emoji: "🔩" },
  gold: { name: "黃金", emoji: "🥇" },
  diamond: { name: "鑽石", emoji: "💎" },
};

const FISH_NAMES: Record<string, { name: string; emoji: string }> = {
  small_fish: { name: "小雜魚", emoji: "🐟" },
  crucian: { name: "鯽魚", emoji: "🎣" },
  shark: { name: "鯊魚", emoji: "🦈" },
  octopus: { name: "章魚", emoji: "🐙" },
  lava_fish: { name: "熔岩魚", emoji: "🐉" },
};

const PLATFORM_NAMES: Record<string, string> = {
  ecpay: "綠界",
  opay: "歐付寶",
};

const TIER_NAMES: Record<string, string> = Object.fromEntries(
  DONATION_TIERS.map((t) => [t.id, `${t.emoji} ${t.name}`]),
);

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.5 5.3A16 16 0 0 0 15.6 4l-.3.5a12 12 0 0 1 3.4 1.4 11 11 0 0 0-9.4 0A12 12 0 0 1 12.7 4.5L12.4 4a16 16 0 0 0-3.9 1.3C5.3 9 4.6 12.6 4.8 16.1A16 16 0 0 0 9.6 18l.6-1a10 10 0 0 1-1.7-.8l.4-.3a8 8 0 0 0 6.9 0l.4.3a10 10 0 0 1-1.7.8l.6 1a16 16 0 0 0 4.8-1.9c.3-4-.8-7.6-3.4-10.8ZM10 13.6c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Zm4.6 0c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Z" />
    </svg>
  );
}

function TopNav({
  identity,
}: {
  identity?: {
    avatar: string;
    name: string;
    id: string;
  };
}) {
  return (
    <nav className="d-topnav">
      <div className="d-brand-row">
        <Link href="/" className="d-logo" aria-label="逼逼機器人 — 回首頁">
          <span className="mark">BB</span>
          <span className="bn">
            DASH<em>BOARD</em>
          </span>
        </Link>
      </div>
      <div className="d-account">
        {identity ? (
          <>
            <span className="d-account-label">Account</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="d-account-avatar"
              src={identity.avatar}
              alt=""
              width={32}
              height={32}
            />
            <span className="d-account-name">{identity.name}</span>
            <form
              action="/api/auth/discord/logout"
              method="post"
              style={{ margin: 0 }}
            >
              <button type="submit" className="d-btn d-btn-ghost">
                登出
              </button>
            </form>
          </>
        ) : (
          <a
            href={INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="d-btn d-btn-discord"
          >
            <DiscordMark className="dc" /> 加入 Discord
          </a>
        )}
      </div>
    </nav>
  );
}

type DashTab =
  | "overview"
  | "transactions"
  | "tax"
  | "invites"
  | "duels"
  | "leaderboard"
  | "lottery"
  | "backpack"
  | "equipment"
  | "buffs"
  | "quests"
  | "badges";

const DASH_TABS: { id: DashTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "backpack", label: "背包" },
  { id: "equipment", label: "裝備" },
  { id: "buffs", label: "加成" },
  { id: "quests", label: "任務" },
  { id: "badges", label: "稱號" },
  { id: "transactions", label: "金流" },
  { id: "tax", label: "稅務" },
  { id: "invites", label: "邀請" },
  { id: "duels", label: "決鬥" },
  { id: "leaderboard", label: "排行榜" },
  { id: "lottery", label: "樂透" },
];

function PageHead({
  title,
  stamps,
  activeTab,
}: {
  title: string;
  stamps?: { v: string; k: string }[];
  activeTab?: DashTab;
}) {
  return (
    <header className="d-page-head">
      <div className="d-page-head-left">
        <h1>{title}</h1>
        {activeTab ? (
          <div className="d-tabs">
            {DASH_TABS.map((t) => (
              <Link
                key={t.id}
                href={t.id === "overview" ? "/dashboard" : `/dashboard?tab=${t.id}`}
                className={"d-tab" + (activeTab === t.id ? " active" : "")}
              >
                {t.label}
              </Link>
            ))}
          </div>
        ) : (
          <span className="d-crumb">/ dashboard</span>
        )}
      </div>
      <div className="d-page-head-right">
        {stamps?.map((s) => (
          <div className="d-stamp" key={s.k}>
            <span className="v">{s.v}</span>
            <span className="k">{s.k}</span>
          </div>
        ))}
      </div>
    </header>
  );
}

const PERIOD_LABELS: Record<CoinHistoryPeriod, string> = {
  today: "今日",
  week: "本週",
  month: "本月",
  all: "全部時間",
};
const DIRECTION_LABELS: Record<CoinHistoryDirection, string> = {
  all: "全部",
  in: "📥 入帳",
  out: "📤 出帳",
};

function asPeriod(v: string | undefined): CoinHistoryPeriod {
  return v === "today" || v === "week" || v === "all" ? v : "month";
}
function asDirection(v: string | undefined): CoinHistoryDirection {
  return v === "in" || v === "out" ? v : "all";
}
function asCategory(v: string | undefined): string {
  return v && COIN_CATEGORIES.some((c) => c.id === v) ? v : "all";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await readSession();
  const params = await searchParams;
  const rawTab = asStr(params.tab);
  const tab: DashTab = DASH_TABS.some((t) => t.id === rawTab)
    ? (rawTab as DashTab)
    : "overview";
  const now = new Date();
  const stamps = [
    {
      v: now.toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      k: "Time",
    },
    {
      v: now.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      k: "Today",
    },
  ];

  if (!session) {
    return (
      <div className="d-app">
        <div className="d-app-frame">
          <TopNav />
          <PageHead title="儀表板" stamps={stamps} />
          <div className="d-login">
            <div className="d-login-inner">
              <h2>
                先用 <em>Discord</em> 登入
              </h2>
              <p>
                儀表板會顯示你在伺服器的金幣、等級、挖礦／釣魚紀錄、金流紀錄與贊助歷史。
                目前只開放查看，所有操作仍請在 Discord 內以斜線指令進行。
              </p>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler, not a page */}
              <a
                href="/api/auth/discord/login?next=/dashboard"
                className="d-btn d-btn-discord d-btn-lg"
              >
                <DiscordMark className="dc" /> 使用 Discord 登入
              </a>
              <p className="d-login-note">
                僅取得 <code>identify</code> 權限（你的 ID、使用者名稱、頭像）。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const guildId = getPrimaryGuildId();
  const displayName = session.globalName ?? session.username;

  return (
    <div className="d-app">
      <div className="d-app-frame">
        <TopNav
          identity={{
            avatar: avatarUrl(session),
            name: displayName,
            id: session.id,
          }}
        />
        <PageHead title="儀表板" stamps={stamps} activeTab={tab} />

        <div className="d-greeting">
          <div className="d-greeting-text">
            <span className="d-greeting-hi">你好，</span>
            <span className="d-greeting-name">{displayName}</span>
          </div>
          <span className="d-uid">id {session.id}</span>
        </div>

        {!guildId && <GuildNotConfigured />}

        {tab === "overview" && (
          <OverviewTab session={session} guildId={guildId} />
        )}
        {tab === "transactions" && (
          <TransactionsTab
            session={session}
            guildId={guildId}
            period={asPeriod(asStr(params.period))}
            direction={asDirection(asStr(params.direction))}
            category={asCategory(asStr(params.category))}
            page={Number.parseInt(asStr(params.page) ?? "0", 10) || 0}
          />
        )}
        {tab === "tax" && (
          <TaxTab
            session={session}
            guildId={guildId}
            period={asTaxPeriod(asStr(params.period))}
          />
        )}
        {tab === "invites" && (
          <InvitesTab session={session} guildId={guildId} />
        )}
        {tab === "duels" && (
          <DuelsTab session={session} guildId={guildId} />
        )}
        {tab === "leaderboard" && (
          <LeaderboardTab
            session={session}
            guildId={guildId}
            category={asLbCategory(asStr(params.category))}
          />
        )}
        {tab === "lottery" && (
          <LotteryTab session={session} guildId={guildId} />
        )}
        {tab === "backpack" && (
          <BackpackTab session={session} guildId={guildId} />
        )}
        {tab === "equipment" && (
          <EquipmentTab session={session} guildId={guildId} />
        )}
        {tab === "buffs" && (
          <BuffsTab session={session} guildId={guildId} />
        )}
        {tab === "quests" && (
          <QuestsTab session={session} guildId={guildId} />
        )}
        {tab === "badges" && (
          <BadgesTab session={session} guildId={guildId} />
        )}

        <p className="d-notice">
          本頁僅顯示資料、不提供任何操作。所有指令（挖礦、釣魚、賣礦、抖內發放等）
          請於 Discord 內透過斜線指令完成。
        </p>

        <footer className="d-foot">
          <div className="copy">
            ©{" "}
            <a
              className="shushu-link"
              href="https://www.shushu.tw/"
              target="_blank"
              rel="noreferrer"
            >
              SHUSHU
            </a>{" "}
            · <b>逼逼機器人 BIBIBOT</b>
          </div>
          <div className="d-foot-links">
            <Link href="/">首頁</Link>
            <a href="/docs" target="_blank" rel="noreferrer">查看文件</a>
            <Link href="/donate">抖內</Link>
            <a href={INVITE_URL} target="_blank" rel="noreferrer">Discord</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function asStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

async function OverviewTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  const [coin, level, mining, donations] = guildId
    ? await Promise.all([
        getCoinSummary(session.id, guildId),
        getLevelSummary(session.id, guildId),
        getMiningSummary(session.id, guildId),
        getDonationHistory(session.id, guildId, 10),
      ])
    : [null, null, null, []];

  return (
    <>
      {guildId && coin === null && <DataUnavailable />}

      {guildId && coin && level && mining && (
        <>
          <HeroRow coin={coin} level={level} mining={mining} />
          <StatRow level={level} />
          <ActivityRow mining={mining} />
          <CollectionRow mining={mining} />
        </>
      )}

      <SectionTitle title="贊助紀錄" en="DONATIONS" />
      {donations.length === 0 ? (
        <div className="d-empty">
          還沒有任何贊助紀錄。
          <Link href="/donate" className="d-empty-link">
            前往贊助頁面 →
          </Link>
        </div>
      ) : (
        <DonationTable items={donations} />
      )}
    </>
  );
}

async function TransactionsTab({
  session,
  guildId,
  period,
  direction,
  category,
  page,
}: {
  session: { id: string };
  guildId: string | null;
  period: CoinHistoryPeriod;
  direction: CoinHistoryDirection;
  category: string;
  page: number;
}) {
  if (!guildId) return null;
  const result = await getCoinHistory(session.id, guildId, {
    period,
    direction,
    category,
    page,
  });
  if (!result) return <DataUnavailable />;
  return (
    <TransactionsView
      result={result}
      period={period}
      direction={direction}
      category={category}
    />
  );
}

function buildTxQuery(
  overrides: {
    period?: CoinHistoryPeriod;
    direction?: CoinHistoryDirection;
    category?: string;
    page?: number;
  },
  base: {
    period: CoinHistoryPeriod;
    direction: CoinHistoryDirection;
    category: string;
  },
): string {
  const period = overrides.period ?? base.period;
  const direction = overrides.direction ?? base.direction;
  const category = overrides.category ?? base.category;
  const page = overrides.page ?? 0;
  const sp = new URLSearchParams();
  sp.set("tab", "transactions");
  if (period !== "month") sp.set("period", period);
  if (direction !== "all") sp.set("direction", direction);
  if (category !== "all") sp.set("category", category);
  if (page > 0) sp.set("page", String(page));
  return `/dashboard?${sp.toString()}`;
}

function fmtTxTime(d: Date): string {
  return new Date(d).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TransactionsView({
  result,
  period,
  direction,
  category,
}: {
  result: CoinHistoryPage;
  period: CoinHistoryPeriod;
  direction: CoinHistoryDirection;
  category: string;
}) {
  const base = { period, direction, category };
  const net = result.inflow + result.outflow;
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const hasPrev = result.page > 0;
  const hasNext =
    result.page + 1 < totalPages && result.page + 1 < COIN_HISTORY_MAX_PAGE;

  return (
    <>
      <div className="d-tx-summary">
        <div className="d-tx-summary-card d-card-feature">
          <span className="d-c-sub">NET</span>
          <span className="d-num-xl">
            {net >= 0 ? "+" : ""}
            {fmt(net)}
          </span>
          <span className="d-feature-meta">
            符合條件 {fmt(result.total)} 筆
          </span>
        </div>
        <div className="d-tx-summary-card">
          <span className="d-c-sub">INFLOW</span>
          <span className="d-num-md d-tx-pos">+{fmt(result.inflow)}</span>
        </div>
        <div className="d-tx-summary-card">
          <span className="d-c-sub">OUTFLOW</span>
          <span className="d-num-md d-tx-neg">{fmt(result.outflow)}</span>
        </div>
      </div>

      <div className="d-tx-filters">
        <div className="d-tx-filter-group">
          <span className="d-tx-filter-lab">期間</span>
          <div className="d-pill-row">
            {(["today", "week", "month", "all"] as CoinHistoryPeriod[]).map(
              (p) => (
                <Link
                  key={p}
                  href={buildTxQuery({ period: p, page: 0 }, base)}
                  className={"d-pill" + (period === p ? " active" : "")}
                >
                  {PERIOD_LABELS[p]}
                </Link>
              ),
            )}
          </div>
        </div>
        <div className="d-tx-filter-group">
          <span className="d-tx-filter-lab">方向</span>
          <div className="d-pill-row">
            {(["all", "in", "out"] as CoinHistoryDirection[]).map((d) => (
              <Link
                key={d}
                href={buildTxQuery({ direction: d, page: 0 }, base)}
                className={"d-pill" + (direction === d ? " active" : "")}
              >
                {DIRECTION_LABELS[d]}
              </Link>
            ))}
          </div>
        </div>
        <div className="d-tx-filter-group d-tx-filter-cats">
          <span className="d-tx-filter-lab">來源</span>
          <div className="d-pill-row d-pill-row-wrap">
            {COIN_CATEGORIES.map((c) => (
              <Link
                key={c.id}
                href={buildTxQuery({ category: c.id, page: 0 }, base)}
                className={"d-pill" + (category === c.id ? " active" : "")}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {result.rows.length === 0 ? (
        <div className="d-empty">
          這個條件下沒有任何金流紀錄。
          <br />
          試著放寬期間或切換方向/來源篩選。
        </div>
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
              {result.rows.map((r, i) => {
                const label =
                  COIN_SOURCE_LABELS[r.source] ?? `❓ ${r.source}`;
                const positive = r.amount > 0;
                return (
                  <tr key={`${r.createdAt.getTime()}-${i}`}>
                    <td>{fmtTxTime(r.createdAt)}</td>
                    <td>{label}</td>
                    <td
                      className={
                        "num " + (positive ? "d-tx-pos" : "d-tx-neg")
                      }
                    >
                      {positive ? "+" : ""}
                      {fmt(r.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(hasPrev || hasNext) && (
        <div className="d-pager">
          {hasPrev ? (
            <Link
              className="d-btn"
              href={buildTxQuery({ page: result.page - 1 }, base)}
            >
              ← 較新
            </Link>
          ) : (
            <span className="d-btn d-btn-disabled">← 較新</span>
          )}
          <span className="d-pager-page">
            第 {result.page + 1} / {Math.min(totalPages, COIN_HISTORY_MAX_PAGE)} 頁
          </span>
          {hasNext ? (
            <Link
              className="d-btn"
              href={buildTxQuery({ page: result.page + 1 }, base)}
            >
              較舊 →
            </Link>
          ) : (
            <span className="d-btn d-btn-disabled">較舊 →</span>
          )}
        </div>
      )}

      <p className="d-notice" style={{ marginTop: 14 }}>
        紀錄保留 90 天。要換條件就重新點上面的篩選 pill；想看完整 90 天就把期間切到「全部時間」。
      </p>
    </>
  );
}

// ── 稅務 / 邀請 / 決鬥 / 排行榜 / 樂透 ────────────────────────────────────────

function asTaxPeriod(v: string | undefined): TaxHistoryPeriod {
  return v === "month" || v === "year" ? v : "all";
}

function asLbCategory(v: string | undefined): LeaderboardKey {
  return LEADERBOARD_CATEGORIES.some((c) => c.key === v)
    ? (v as LeaderboardKey)
    : "level";
}

async function TaxTab({
  session,
  guildId,
  period,
}: {
  session: { id: string };
  guildId: string | null;
  period: TaxHistoryPeriod;
}) {
  if (!guildId) return null;
  const result = await getTaxHistory(session.id, guildId, period);
  if (!result) return <DataUnavailable />;
  return <TaxView result={result} period={period} />;
}

function TaxView({
  result,
  period,
}: {
  result: TaxHistorySummary;
  period: TaxHistoryPeriod;
}) {
  const periodPills: { id: TaxHistoryPeriod; label: string }[] = [
    { id: "month", label: "本月" },
    { id: "year", label: "今年" },
    { id: "all", label: "全部時間" },
  ];
  const avgRatePct = result.avgRate !== null ? (result.avgRate * 100).toFixed(2) : null;

  return (
    <>
      <div className="d-tx-summary">
        <div className="d-tx-summary-card d-card-feature">
          <span className="d-c-sub">TOTAL TAXED</span>
          <span className="d-num-xl">{fmt(result.totalTaxed)}</span>
          <span className="d-feature-meta">共 {fmt(result.count)} 次扣繳</span>
        </div>
        <div className="d-tx-summary-card">
          <span className="d-c-sub">AVG RATE</span>
          <span className="d-num-md d-tx-neg">
            {avgRatePct !== null ? `${avgRatePct}%` : "—"}
          </span>
        </div>
        <div className="d-tx-summary-card">
          <span className="d-c-sub">LATEST</span>
          <span className="d-num-md">
            {result.rows[0] ? fmt(Math.abs(result.rows[0].amount)) : "—"}
          </span>
        </div>
      </div>

      <div className="d-tx-filters">
        <div className="d-tx-filter-group">
          <span className="d-tx-filter-lab">期間</span>
          <div className="d-pill-row">
            {periodPills.map((p) => {
              const sp = new URLSearchParams({ tab: "tax" });
              if (p.id !== "all") sp.set("period", p.id);
              return (
                <Link
                  key={p.id}
                  href={`/dashboard?${sp.toString()}`}
                  className={"d-pill" + (period === p.id ? " active" : "")}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {result.rows.length === 0 ? (
        <div className="d-empty">
          這個期間沒有任何財富稅紀錄，恭喜你逃過一劫 🎉
        </div>
      ) : (
        <div className="d-table-wrap">
          <table className="d-tbl">
            <thead>
              <tr>
                <th>時間</th>
                <th>稅前餘額 → 稅後</th>
                <th>稅率</th>
                <th className="num">扣繳</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r, i) => (
                <tr key={`${r.createdAt.getTime()}-${i}`}>
                  <td>{fmtTxTime(r.createdAt)}</td>
                  <td>
                    {r.before !== null
                      ? `${fmt(r.before)} → ${fmt(r.before - Math.abs(r.amount))}`
                      : "—"}
                  </td>
                  <td>
                    {r.effectiveRate !== null
                      ? `${(r.effectiveRate * 100).toFixed(2)}%`
                      : "—"}
                  </td>
                  <td className="num d-tx-neg">
                    -{fmt(Math.abs(r.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="d-notice">
        財富稅每週一結算，餘額越高邊際稅率越高。
      </p>
    </>
  );
}

async function InvitesTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const stats = await getInviteStats(session.id, guildId);
  if (!stats) return <DataUnavailable />;
  return <InvitesView stats={stats} />;
}

function InvitesView({ stats }: { stats: InviteStats }) {
  const net = stats.totalReward - stats.totalClawback;
  return (
    <>
      <div className="d-grid-3">
        <div className="d-card d-card-feature">
          <CardHead title="有效邀請" sub="ACTIVE" />
          <div className="d-card-body">
            <div className="d-num-xl">{fmt(stats.active)}</div>
            <div className="d-kbd">人</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="已退坑" sub="LEFT" />
          <div className="d-card-body">
            <div className="d-num-md">{fmt(stats.left)}</div>
            <div className="d-kbd">人</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="已扣回" sub="CLAWED BACK" />
          <div className="d-card-body">
            <div className="d-num-md">{fmt(stats.clawedBack)}</div>
            <div className="d-kbd">人</div>
          </div>
        </div>
      </div>
      <div className="d-grid-3">
        <div className="d-card">
          <CardHead title="累積獲得" sub="REWARD" />
          <div className="d-card-body">
            <div className="d-num-md d-tx-pos">
              +{fmt(stats.totalReward)}
            </div>
            <div className="d-kbd">幣</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="累積扣回" sub="CLAWBACK" />
          <div className="d-card-body">
            <div className="d-num-md d-tx-neg">
              -{fmt(stats.totalClawback)}
            </div>
            <div className="d-kbd">幣</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="淨收益" sub="NET" />
          <div className="d-card-body">
            <div
              className={
                "d-num-md " + (net >= 0 ? "d-tx-pos" : "d-tx-neg")
              }
            >
              {net >= 0 ? "+" : ""}
              {fmt(net)}
            </div>
            <div className="d-kbd">幣</div>
          </div>
        </div>
      </div>
      <p className="d-notice">
        邀請統計每筆按獎勵公式計算；新成員若在期限內退坑會自動扣回對應金幣。
      </p>
    </>
  );
}

async function DuelsTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const result = await getDuelHistory(session.id, guildId, 10);
  if (!result) return <DataUnavailable />;
  return <DuelsView result={result} />;
}

function DuelsView({ result }: { result: DuelHistorySummary }) {
  return (
    <>
      <div className="d-grid-3">
        <div className="d-card d-card-feature">
          <CardHead title="勝率" sub="WIN RATE" />
          <div className="d-card-body">
            <div className="d-num-xl">
              {(result.winRate * 100).toFixed(0)}
              <span className="d-num-unit">%</span>
            </div>
            <div className="d-feature-meta">
              {fmt(result.wins)} 勝 {fmt(result.losses)} 負
            </div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="總場數" sub="TOTAL" />
          <div className="d-card-body">
            <div className="d-num-md">{fmt(result.total)}</div>
            <div className="d-kbd">場</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="最近一場" sub="LAST" />
          <div className="d-card-body">
            <div className="d-num-md">
              {result.rows[0]
                ? result.rows[0].isWin
                  ? "🏆 勝"
                  : "💀 負"
                : "—"}
            </div>
            <div className="d-kbd">
              {result.rows[0] ? fmtTxTime(result.rows[0].completedAt) : "—"}
            </div>
          </div>
        </div>
      </div>

      {result.rows.length === 0 ? (
        <div className="d-empty">
          還沒有完成過任何決鬥，到 Discord 用 <code>/決鬥</code> 開戰。
        </div>
      ) : (
        <div className="d-table-wrap">
          <table className="d-tbl">
            <thead>
              <tr>
                <th>時間</th>
                <th>結果</th>
                <th>對手</th>
                <th>賭注</th>
                <th className="num">收支</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r, i) => (
                <tr key={`${r.completedAt.getTime()}-${i}`}>
                  <td>{fmtTxTime(r.completedAt)}</td>
                  <td>{r.isWin ? "🏆 勝" : "💀 負"}</td>
                  <td className="mono">
                    <code className="d-uid-code">{r.opponentId}</code>
                  </td>
                  <td>{fmt(r.bet)}</td>
                  <td
                    className={
                      "num " + (r.net > 0 ? "d-tx-pos" : "d-tx-neg")
                    }
                  >
                    {r.net > 0 ? "+" : ""}
                    {fmt(r.net)}
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

async function LeaderboardTab({
  session,
  guildId,
  category,
}: {
  session: { id: string };
  guildId: string | null;
  category: LeaderboardKey;
}) {
  if (!guildId) return null;
  const result = await getLeaderboard(
    guildId,
    category,
    "all",
    session.id,
    10,
  );
  if (!result) return <DataUnavailable />;
  return (
    <LeaderboardView result={result} category={category} viewerId={session.id} />
  );
}

function LeaderboardView({
  result,
  category,
  viewerId,
}: {
  result: LeaderboardResult;
  category: LeaderboardKey;
  viewerId: string;
}) {
  const def = LEADERBOARD_CATEGORIES.find((c) => c.key === category)!;
  return (
    <>
      <div className="d-tx-filters">
        <div className="d-tx-filter-group">
          <span className="d-tx-filter-lab">類別</span>
          <div className="d-pill-row d-pill-row-wrap">
            {LEADERBOARD_CATEGORIES.map((c) => {
              const sp = new URLSearchParams({ tab: "leaderboard" });
              if (c.key !== "level") sp.set("category", c.key);
              return (
                <Link
                  key={c.key}
                  href={`/dashboard?${sp.toString()}`}
                  className={"d-pill" + (category === c.key ? " active" : "")}
                >
                  {c.emoji} {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {result.myRank !== null && (
        <div className="d-empty d-my-rank">
          你目前排在 <strong>#{result.myRank}</strong> ・{" "}
          {fmt(result.myValue ?? 0)} {def.unit}
          {def.key === "level" && (
            <>
              {" "}
              · 共 {fmt(result.total)} 位玩家上榜
            </>
          )}
        </div>
      )}

      {result.rows.length === 0 ? (
        <div className="d-empty">這個類別還沒有任何上榜紀錄。</div>
      ) : (
        <div className="d-table-wrap">
          <table className="d-tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>玩家</th>
                <th className="num">
                  {def.label} ({def.unit})
                </th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r, i) => {
                const isMe = r.userId === viewerId;
                return (
                  <tr
                    key={r.userId}
                    className={isMe ? "d-tr-me" : undefined}
                  >
                    <td className="mono">#{i + 1}</td>
                    <td>
                      <code className="d-uid-code">{r.userId}</code>
                      {r.sub ? <span className="d-row-sub"> · {r.sub}</span> : null}
                      {isMe ? (
                        <span className="d-tag-me">你</span>
                      ) : null}
                    </td>
                    <td className="num">{fmt(r.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="d-notice">
        現階段排行榜只支援「全部時間」聚合；按時間切片（today/week/month）需要等對應的彙整 collection 對齊，會在後續批次補上。
      </p>
    </>
  );
}

async function LotteryTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const data = await getLotteryDigest(guildId, session.id);
  if (!data) return <DataUnavailable />;
  return <LotteryView open={data.open} recent={data.recent} />;
}

function LotteryView({
  open,
  recent,
}: {
  open: LotteryDrawSummary[];
  recent: LotteryDrawSummary[];
}) {
  return (
    <>
      <SectionTitle title="當期開放" en="OPEN DRAWS" />
      {open.length === 0 ? (
        <div className="d-empty">目前沒有開放中的樂透。</div>
      ) : (
        <div className="d-grid-3">
          {open.map((d) => {
            const cfg =
              LOTTERY_TYPE_LABELS[d.lotteryType] ?? {
                label: d.lotteryType,
                emoji: "🎟️",
              };
            return (
              <div key={d.drawId} className="d-card">
                <CardHead
                  title={`${cfg.emoji} ${cfg.label}`}
                  sub={`第 ${d.drawNumber} 期`}
                />
                <div className="d-card-body">
                  <div className="d-num-md">{fmt(d.pool)}</div>
                  <div className="d-kbd">彩池</div>
                  <div
                    className="d-row between"
                    style={{ marginTop: 10, fontSize: 12 }}
                  >
                    <span className="d-kicker">
                      總票 {fmt(d.totalTickets)}
                    </span>
                    <span className="d-kicker mono">
                      你 {fmt(d.myTickets ?? 0)} 張
                    </span>
                  </div>
                  <div
                    className="d-kicker"
                    style={{ marginTop: 8 }}
                  >
                    開獎 {fmtTxTime(d.scheduledAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionTitle title="近期開獎" en="RECENT RESULTS" />
      {recent.length === 0 ? (
        <div className="d-empty">沒有任何已開獎紀錄。</div>
      ) : (
        <div className="d-table-wrap">
          <table className="d-tbl">
            <thead>
              <tr>
                <th>玩法</th>
                <th>期數</th>
                <th>中獎號碼</th>
                <th className="num">彩池</th>
                <th>開獎時間</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((d) => {
                const cfg =
                  LOTTERY_TYPE_LABELS[d.lotteryType] ?? {
                    label: d.lotteryType,
                    emoji: "🎟️",
                  };
                return (
                  <tr key={d.drawId}>
                    <td>
                      {cfg.emoji} {cfg.label}
                    </td>
                    <td className="mono">#{d.drawNumber}</td>
                    <td className="mono">
                      {d.winningNumbers && d.winningNumbers.length > 0
                        ? d.winningNumbers.join(" · ")
                        : "—"}
                    </td>
                    <td className="num">{fmt(d.pool)}</td>
                    <td>{fmtTxTime(d.scheduledAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="d-notice">
        樂透開獎時間與彩池由 bot 自動結算。詳細玩法與訂閱請用 Discord 的{" "}
        <code>/樂透</code> 指令。
      </p>
    </>
  );
}

// ── 背包 / 裝備 / 加成 / 任務 / 稱號 ─────────────────────────────────────────

async function BackpackTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const bag = await getBackpack(session.id, guildId);
  if (!bag) return <DataUnavailable />;
  return <BackpackView bag={bag} />;
}

function BackpackView({ bag }: { bag: BackpackSummary }) {
  const oreEntries = Object.entries(ORES);
  const fishEntries = Object.entries(FISH);
  const usedSlots = Object.values(bag.oreBag).reduce(
    (sum, n) => sum + (Number(n) || 0),
    0,
  );

  return (
    <>
      <div className="d-grid-3">
        <div className="d-card d-card-feature">
          <CardHead title="背包容量" sub="SLOTS" />
          <div className="d-card-body">
            <div className="d-num-xl">
              {fmt(usedSlots)}
              <span className="d-num-unit"> / {fmt(bag.backpackSlots)}</span>
            </div>
            <div className="d-bar" style={{ marginTop: 14 }}>
              <span
                style={{
                  width: `${Math.min(100, (usedSlots / bag.backpackSlots) * 100)}%`,
                }}
              />
            </div>
            <span className="d-feature-meta" style={{ marginTop: 6 }}>
              礦石總格
            </span>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="魚袋（持有中）" sub="FISH BAG" />
          <div className="d-card-body">
            <div className="d-num-md">
              {fmt(
                Object.values(bag.fishBag).reduce(
                  (s, n) => s + (Number(n) || 0),
                  0,
                ),
              )}
            </div>
            <div className="d-kbd">尾</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="傳說素材碎片" sub="LEGENDARY" />
          <div className="d-card-body">
            <div className="d-num-md">{fmt(bag.legendaryFragments)}</div>
            <div className="d-kbd">片</div>
          </div>
        </div>
      </div>

      <SectionTitle title="礦袋（持有中）" en="ORE BAG" />
      <div className="d-grid-2-eq">
        <div className="d-card">
          <CardHead title="目前持有" sub="CARRYING" />
          <div className="d-row-list">
            {oreEntries.map(([id, info]) => (
              <div key={id} className="d-list-row">
                <span className="d-list-key">
                  <span className="d-emoji">{info.emoji}</span>
                  {info.name}
                </span>
                <span className="d-list-val">{fmt(bag.oreBag[id] ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="d-card">
          <CardHead title="累計挖到" sub="LIFETIME" />
          <div className="d-row-list">
            {oreEntries.map(([id, info]) => (
              <div key={id} className="d-list-row">
                <span className="d-list-key">
                  <span className="d-emoji">{info.emoji}</span>
                  {info.name}
                </span>
                <span className="d-list-val">
                  {fmt(bag.lifetimeOre[id] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle title="魚袋（持有中）" en="FISH BAG" />
      <div className="d-card">
        <div className="d-row-list">
          {fishEntries.map(([id, info]) => (
            <div key={id} className="d-list-row">
              <span className="d-list-key">
                <span className="d-emoji">{info.emoji}</span>
                {info.name}
              </span>
              <span className="d-list-val">{fmt(bag.fishBag[id] ?? 0)}</span>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle title="道具" en="ITEMS" />
      {Object.keys(bag.items).length === 0 ? (
        <div className="d-empty">背包裡沒有任何道具。</div>
      ) : (
        <div className="d-card">
          <div className="d-row-list">
            {Object.entries(bag.items).map(([id, qty]) => {
              const def = SHOP_ITEMS[id];
              return (
                <div key={id} className="d-list-row">
                  <span className="d-list-key">
                    <span className="d-emoji">{def?.emoji ?? "🎁"}</span>
                    {def?.name ?? id}
                    {def?.category ? (
                      <span className="d-row-sub"> · {def.category}</span>
                    ) : null}
                  </span>
                  <span className="d-list-val">{fmt(qty)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

async function EquipmentTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const eq = await getEquipment(session.id, guildId);
  if (!eq) return <DataUnavailable />;
  return <EquipmentView eq={eq} />;
}

function EquipmentView({ eq }: { eq: EquipmentSummary }) {
  const pickaxe = PICKAXES[eq.pickaxe] ?? PICKAXES.wood;
  const rod = RODS[eq.fishingRod] ?? RODS.bamboo;
  const weapon = WEAPONS[eq.weapon] ?? WEAPONS.fist;
  const totalAtk = DUNGEON_BASE_ATK + weapon.atk;

  return (
    <>
      <div className="d-grid-3">
        <div className="d-card d-card-feature">
          <CardHead title="鎬子" sub="PICKAXE" />
          <div className="d-card-body">
            <div className="d-num-md">
              {pickaxe.emoji} {pickaxe.name}
            </div>
            <div className="d-feature-meta" style={{ marginTop: 10 }}>
              幸運 +{Math.round(pickaxe.luckBonus * 100)}% · 數量 +
              {pickaxe.qtyBonus}
            </div>
            <div className="d-feature-meta">
              CD 縮短 {Math.round(pickaxe.cdReductionMs / 60000)} 分
            </div>
            <div className="d-feature-meta">
              耐久：
              {pickaxe.durability === null
                ? "永久"
                : eq.pickaxeDurability !== null
                  ? `${fmt(eq.pickaxeDurability)} / ${fmt(pickaxe.durability)}`
                  : `— / ${fmt(pickaxe.durability)}`}
            </div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="釣竿" sub="ROD" />
          <div className="d-card-body">
            <div className="d-num-md">
              {rod.emoji} {rod.name}
            </div>
            <div className="d-kbd" style={{ marginTop: 10 }}>
              成功率 +{Math.round(rod.successBonus * 100)}% · 稀有 +{rod.rareBonus}
            </div>
            <div className="d-kbd">
              CD 縮短 {Math.round(rod.cdReductionMs / 60000)} 分
            </div>
            <div className="d-kbd">
              耐久：
              {rod.durability === null
                ? "永久"
                : eq.fishingRodDurability !== null
                  ? `${fmt(eq.fishingRodDurability)} / ${fmt(rod.durability)}`
                  : `— / ${fmt(rod.durability)}`}
            </div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="武器" sub="WEAPON" />
          <div className="d-card-body">
            <div className="d-num-md">
              {weapon.emoji} {weapon.name}
            </div>
            <div className="d-kbd" style={{ marginTop: 10 }}>
              戰鬥力 {fmt(totalAtk)}（基礎 {fmt(DUNGEON_BASE_ATK)} + 武器{" "}
              {fmt(weapon.atk)}）
            </div>
            <div className="d-kbd">
              暴擊 {Math.round(weapon.critRate * 100)}%
            </div>
            <div className="d-kbd">
              耐久：
              {weapon.durability === null
                ? "永久"
                : eq.weaponDurability !== null
                  ? `${fmt(eq.weaponDurability)} / ${fmt(weapon.durability)}`
                  : `— / ${fmt(weapon.durability)}`}
            </div>
          </div>
        </div>
      </div>

      <div className="d-grid-3">
        <div className="d-card">
          <CardHead title="體力（地下城）" sub="STAMINA" />
          <div className="d-card-body">
            <div className="d-num-md">
              {eq.stamina === null ? "—" : fmt(eq.stamina)}
            </div>
            <div className="d-kbd">點</div>
          </div>
        </div>
      </div>

      <p className="d-notice">
        合成更高階裝備請在 Discord 用 <code>/裝備</code> 或 <code>/合成</code>{" "}
        指令；網站只顯示目前持有與屬性。
      </p>
    </>
  );
}

async function BuffsTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const buffs = await getActiveBuffs(session.id, guildId);
  if (buffs === null) return <DataUnavailable />;
  return <BuffsView buffs={buffs} />;
}

function BuffsView({ buffs }: { buffs: ActiveBuff[] }) {
  const xpBuffs = buffs.filter((b) => b.type === "xp_boost");
  const coinBuffs = buffs.filter((b) => b.type === "coin_boost");

  return (
    <>
      <div className="d-grid-2-eq">
        <div className="d-card d-card-feature">
          <CardHead title="最佳 XP 加成" sub="XP BOOST" />
          <div className="d-card-body">
            <div className="d-num-xl">
              ×{maxMult(xpBuffs).toFixed(2)}
            </div>
            <span className="d-feature-meta">
              共 {fmt(xpBuffs.length)} 個生效中
            </span>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="最佳金幣加成" sub="COIN BOOST" />
          <div className="d-card-body">
            <div className="d-num-xl">
              ×{maxMult(coinBuffs).toFixed(2)}
            </div>
            <div className="d-kbd">{fmt(coinBuffs.length)} 個生效中</div>
          </div>
        </div>
      </div>

      <SectionTitle title="目前生效 buff" en="ACTIVE BUFFS" />
      {buffs.length === 0 ? (
        <div className="d-empty">
          目前沒有任何生效中的 buff。到 Discord 用 <code>/商店</code>{" "}
          買藥水即可獲得加成。
        </div>
      ) : (
        <div className="d-table-wrap">
          <table className="d-tbl">
            <thead>
              <tr>
                <th>來源</th>
                <th>類型</th>
                <th>倍率</th>
                <th>結束時間</th>
              </tr>
            </thead>
            <tbody>
              {buffs.map((b, i) => {
                const def = b.source ? SHOP_ITEMS[b.source] : null;
                return (
                  <tr key={`${b.source ?? "x"}-${b.expiresAt.getTime()}-${i}`}>
                    <td>
                      {def?.emoji ?? "🧪"} {def?.name ?? b.source ?? "—"}
                    </td>
                    <td>
                      {b.type === "xp_boost"
                        ? "XP 加成"
                        : b.type === "coin_boost"
                          ? "金幣加成"
                          : b.type}
                    </td>
                    <td className="mono">×{b.multiplier.toFixed(2)}</td>
                    <td>{fmtTxTime(b.expiresAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="d-notice">
        加成只列 XP / 金幣 buff 兩類。挖礦幸運／釣魚／食物 buff 等可在 Discord 用{" "}
        <code>/加成</code> 查看完整版（含限時活動與食物 buff）。
      </p>
    </>
  );
}

function maxMult(buffs: ActiveBuff[]): number {
  let m = 1;
  for (const b of buffs) {
    if (b.multiplier > m) m = b.multiplier;
  }
  return m;
}

async function QuestsTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const status = await getQuestStatus(session.id, guildId);
  if (!status) return <DataUnavailable />;
  return <QuestsView status={status} />;
}

function QuestsView({ status }: { status: QuestStatus }) {
  const ready = [...status.daily, ...status.weekly].filter(
    (q) => q.state === "ready",
  ).length;
  return (
    <>
      {ready > 0 && (
        <div className="d-empty d-my-rank" style={{ textAlign: "left" }}>
          有 <strong>{ready}</strong> 個任務剛完成、等待自動入帳。如未到帳，請到
          Discord 按「領錢」按鈕補領。
        </div>
      )}

      <SectionTitle title="🌞 每日任務" en="DAILY" />
      <QuestList defs={DAILY_QUESTS} rows={status.daily} />

      <SectionTitle title="📅 週常任務" en="WEEKLY" />
      <QuestList defs={WEEKLY_QUESTS} rows={status.weekly} />

      <p className="d-notice">
        任務完成會自動入帳；如未到帳，請到 Discord 按 <code>/逼幣任務</code>{" "}
        裡的「領錢」補領。
      </p>
    </>
  );
}

function QuestList({
  defs,
  rows,
}: {
  defs: QuestDef[];
  rows: QuestStateRow[];
}) {
  const byId = new Map(rows.map((r) => [r.questId, r]));
  return (
    <div className="d-quests">
      {defs.map((def) => {
        const r = byId.get(def.id) ?? {
          questId: def.id,
          progress: 0,
          target: def.target,
          completed: false,
          claimed: false,
          state: "pending" as const,
        };
        const pct = Math.min(
          100,
          Math.round((r.progress / Math.max(1, r.target)) * 100),
        );
        const stateLabel =
          r.state === "claimed"
            ? "已領取"
            : r.state === "ready"
              ? "待入帳"
              : r.state === "in_progress"
                ? "進行中"
                : "未開始";
        return (
          <div
            key={def.id}
            className={"d-quest" + (r.state === "ready" ? " d-quest-ready" : "")}
          >
            <div className="d-quest-head">
              <div>
                <span className="d-quest-name">{def.name}</span>
                <span className="d-quest-state">{stateLabel}</span>
              </div>
              <span className="d-quest-reward">+{fmt(def.reward)} 幣</span>
            </div>
            <div className="d-quest-desc">{def.description}</div>
            <div className="d-row between" style={{ marginTop: 8 }}>
              <span className="d-kicker mono">
                {fmt(r.progress)} / {fmt(r.target)}
              </span>
              <span className="d-kicker mono">{pct}%</span>
            </div>
            <div className="d-bar d-bar-accent">
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function BadgesTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const level = await getLevelSummary(session.id, guildId);
  if (!level) return <DataUnavailable />;
  const rows = evaluateBadges(level);
  return <BadgesView rows={rows} />;
}

function BadgesView({ rows }: { rows: BadgeProgressRow[] }) {
  const unlocked = rows.filter((r) => r.unlocked).length;
  const total = rows.length;
  const byCat = new Map<BadgeCategory, BadgeProgressRow[]>();
  for (const r of rows) {
    const arr = byCat.get(r.def.category) ?? [];
    arr.push(r);
    byCat.set(r.def.category, arr);
  }

  return (
    <>
      <div className="d-grid-3">
        <div className="d-card d-card-feature">
          <CardHead title="已解鎖" sub="UNLOCKED" />
          <div className="d-card-body">
            <div className="d-num-xl">
              {fmt(unlocked)}
              <span className="d-num-unit"> / {fmt(total)}</span>
            </div>
            <div className="d-bar" style={{ marginTop: 14 }}>
              <span style={{ width: `${(unlocked / total) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="進度" sub="PROGRESS" />
          <div className="d-card-body">
            <div className="d-num-md">
              {Math.round((unlocked / total) * 100)}%
            </div>
            <div className="d-kbd">完成度</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="下一個目標" sub="NEXT" />
          <div className="d-card-body">
            {(() => {
              const next = rows
                .filter((r) => !r.unlocked)
                .sort((a, b) => b.progress - a.progress)[0];
              return next ? (
                <>
                  <div className="d-num-md">
                    {next.def.emoji} {next.def.name}
                  </div>
                  <div className="d-kbd">{next.def.description}</div>
                </>
              ) : (
                <div className="d-num-md">🎉 全部解鎖</div>
              );
            })()}
          </div>
        </div>
      </div>

      {Array.from(byCat.entries()).map(([cat, items]) => (
        <div key={cat}>
          <SectionTitle title={BADGE_CATEGORIES[cat]} en={cat.toUpperCase()} />
          <div className="d-badges">
            {items.map((it) => (
              <div
                key={it.def.id}
                className={
                  "d-badge" + (it.unlocked ? " d-badge-on" : " d-badge-off")
                }
                title={it.def.description}
              >
                <span className="d-badge-emoji">{it.def.emoji}</span>
                <span className="d-badge-name">{it.def.name}</span>
                <span className="d-badge-prog">
                  {fmt(it.current)} / {fmt(it.def.threshold)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="d-notice">
        徽章顯示僅供瀏覽，要把某個徽章設為等級卡稱號請到 Discord 用{" "}
        <code>/稱號</code>。
      </p>
    </>
  );
}

function HeroRow({
  coin,
  level,
  mining,
}: {
  coin: CoinSummary;
  level: LevelSummary;
  mining: MiningSummary;
}) {
  const pickaxeName = PICKAXE_NAMES[mining.pickaxe] ?? mining.pickaxe;
  const rodName = ROD_NAMES[mining.fishingRod] ?? mining.fishingRod;
  const progressPct = Math.round(level.progress * 100);
  return (
    <div className="d-grid-2">
      <div className="d-card d-card-feature">
        <CardHead title="Wallet" sub="總持有 · 含累積" />
        <div className="d-card-body">
          <div className="d-num-xxl">{fmt(coin.totalCoins)}</div>
          <div className="d-kbd">credits</div>
          <div className="d-bar" style={{ marginTop: 20 }}>
            <span style={{ width: "100%" }} />
          </div>
          <div className="d-row between" style={{ marginTop: 10 }}>
            <span className="d-feature-meta">
              累積收入 {fmt(coin.lifetimeCoins)}
            </span>
            <span className="d-feature-meta mono">幣 · COIN</span>
          </div>
        </div>
      </div>

      <div className="d-card">
        <CardHead title="Level &amp; XP" sub={`下一級 ${progressPct}%`} />
        <div className="d-metric-strip">
          <div className="d-metric">
            <div className="d-metric-lab">Level</div>
            <div className="d-num-xl">{level.level}</div>
            <div className="d-metric-unit">總 {fmt(level.totalXp)} XP</div>
          </div>
          <div className="d-metric">
            <div className="d-metric-lab">裝備</div>
            <div className="d-equip-list">
              <div className="d-equip-row">
                <span>鎬</span>
                <span className="v">{pickaxeName}</span>
              </div>
              <div className="d-equip-row">
                <span>竿</span>
                <span className="v">{rodName}</span>
              </div>
              <div className="d-equip-row">
                <span>體</span>
                <span className="v">
                  {mining.stamina === null ? "—" : fmt(mining.stamina)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="d-card-body" style={{ paddingTop: 0 }}>
          <div className="d-row between" style={{ marginBottom: 8 }}>
            <span className="d-kicker">
              {fmt(level.currentLevelXp)} / {fmt(level.xpToNextLevel)} XP
            </span>
            <span className="mono d-kicker">{progressPct}%</span>
          </div>
          <div className="d-bar d-bar-accent">
            <span style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ level }: { level: LevelSummary }) {
  const voiceHours = Math.floor(level.totalVoiceMinutes / 60);
  const voiceMins = level.totalVoiceMinutes % 60;
  return (
    <div className="d-grid-3">
      <div className="d-card">
        <CardHead title="發言累計" sub="MESSAGES" />
        <div className="d-card-body">
          <div className="d-num-xl">{fmt(level.totalMessages)}</div>
          <div className="d-kbd">messages</div>
        </div>
      </div>
      <div className="d-card">
        <CardHead title="語音累計" sub="VOICE" />
        <div className="d-card-body">
          <div className="d-num-xl">
            {fmt(voiceHours)}
            <span className="d-num-unit">h</span> {voiceMins}
            <span className="d-num-unit">m</span>
          </div>
          <div className="d-kbd">{fmt(level.totalVoiceMinutes)} minutes total</div>
        </div>
      </div>
      <div className="d-card d-card-feature">
        <CardHead title="連勝" sub="STREAK" />
        <div className="d-card-body">
          <div className="d-num-xl">
            {fmt(level.streak)}
            <span className="d-num-unit"> 天</span>
          </div>
          <div className="d-row between" style={{ marginTop: 10 }}>
            <span className="d-feature-meta">最長 {fmt(level.longestStreak)} 天</span>
            <span className="d-feature-meta mono">累計簽到 {fmt(level.totalCheckins)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({ mining }: { mining: MiningSummary }) {
  const items: { label: string; value: number }[] = [
    { label: "挖礦次數", value: mining.mineCountTotal },
    { label: "釣魚次數", value: mining.fishCountTotal },
    { label: "打工次數", value: mining.workCountTotal },
    { label: "地下城通關", value: mining.dungeonCount },
    { label: "合成次數", value: mining.craftCountTotal },
  ];
  return (
    <>
      <SectionTitle title="活動紀錄" en="ACTIVITY" />
      <div className="d-grid-5">
        {items.map((it) => (
          <div key={it.label} className="d-card d-card-small">
            <span className="d-mini-lab">{it.label}</span>
            <span className="d-num-md">{fmt(it.value)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function CollectionRow({ mining }: { mining: MiningSummary }) {
  const oreEntries = Object.entries(ORE_NAMES);
  const fishEntries = Object.entries(FISH_NAMES);
  return (
    <>
      <SectionTitle title="挖礦・釣魚收穫" en="HARVEST" />
      <div className="d-grid-2-eq">
        <div className="d-card">
          <CardHead title="累計挖到" sub="LIFETIME ORE" />
          <div className="d-row-list">
            {oreEntries.map(([id, info]) => (
              <div key={id} className="d-list-row">
                <span className="d-list-key">
                  <span className="d-emoji">{info.emoji}</span>
                  {info.name}
                </span>
                <span className="d-list-val">
                  {fmt(mining.lifetimeOre[id] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="d-card">
          <CardHead title="魚袋（持有中）" sub="FISH BAG" />
          <div className="d-row-list">
            {fishEntries.map(([id, info]) => (
              <div key={id} className="d-list-row">
                <span className="d-list-key">
                  <span className="d-emoji">{info.emoji}</span>
                  {info.name}
                </span>
                <span className="d-list-val">
                  {fmt(mining.fishBag[id] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function DonationTable({ items }: { items: DonationHistoryItem[] }) {
  return (
    <div className="d-table-wrap">
      <table className="d-tbl">
        <thead>
          <tr>
            <th>時間</th>
            <th>方案</th>
            <th>平台</th>
            <th className="num">金額</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.tradeNo}>
              <td>{fmtDate(it.grantedAt)}</td>
              <td>{it.tierId ? TIER_NAMES[it.tierId] ?? it.tierId : "—"}</td>
              <td>{PLATFORM_NAMES[it.platform] ?? it.platform}</td>
              <td className="num">NT$ {fmt(it.amountNtd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="d-c-head">
      <div>
        <div className="d-c-title">{title}</div>
        {sub && <div className="d-c-sub">{sub}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ title, en }: { title: string; en: string }) {
  return (
    <div className="d-section-title">
      <h2>{title}</h2>
      <span className="d-section-en">{en}</span>
    </div>
  );
}

function GuildNotConfigured() {
  return (
    <div className="d-empty">
      尚未設定 <code>PRIMARY_GUILD_ID</code>，無法顯示個人遊戲資料。
      <br />
      請在伺服器環境變數中補上對應的 Discord 伺服器 ID。
    </div>
  );
}

function DataUnavailable() {
  return (
    <div className="d-empty">
      目前無法連到資料庫（<code>MONGODB_URI_READONLY</code> 未設定或連線失敗）。
      <br />
      贊助以外的資料暫時無法顯示，請稍後重試。
    </div>
  );
}
