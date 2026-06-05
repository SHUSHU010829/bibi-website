import Link from "next/link";
import { readSession, avatarUrl } from "@/lib/donation/session";
import { isCurrentUserAdmin } from "@/lib/admin/permissions";
import {
  fmtDateTime,
  fmtShortDateTime,
  fmtTime as fmtTimeOfDay,
} from "@/lib/format/time";
import {
  getCoinSummary,
  getLevelSummary,
  getMiningSummary,
  getDonationHistory,
  getCoinHistory,
  getTaxHistory,
  getInviteStats,
  getLotteryDigest,
  getActiveBuffs,
  getBackpack,
  getEquipment,
  getFoodStockpile,
  getQuestStatus,
  getQuestAssignment,
  getFarmStatus,
  getStockPortfolio,
  getGuildClubMembership,
  getProfileBuffSources,
  evaluateBadges,
  getPrimaryGuildId,
  COIN_SOURCE_LABELS,
  COIN_CATEGORIES,
  COIN_HISTORY_MAX_PAGE,
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
  type LotteryDrawSummary,
  type ActiveBuff,
  type BackpackSummary,
  type EquipmentSummary,
  type FoodStockpile,
  type FoodBuff,
  type DonorLuckBuff,
  type QuestStatus,
  type QuestStateRow,
  type QuestAssignmentBundle,
  type QuestAssignment,
  type FarmStatus,
  type StockPortfolio,
  type GuildClubInfo,
  type BadgeProgressRow,
} from "@/lib/dashboard/profile";
import {
  ORES,
  FISH,
  PICKAXES,
  RODS,
  WEAPONS,
  SHOP_ITEMS,
  RECIPES,
  FOOD_STORAGE,
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  BADGE_CATEGORIES,
  DUNGEON_BASE_ATK,
  CROPS,
  SEEDS,
  FERTILIZERS,
  CROP_STATUS_LABELS,
  GUILD_CLUB_LEVELS,
  GUILD_CLUB_ROLE_LABELS,
  guildClubBuffLabel,
  FOOD_BUFF_TYPE_LABELS,
  STOCKS,
  STOCK_TYPE_LABELS,
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
  return fmtDateTime(d);
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
  isAdmin,
}: {
  identity?: {
    avatar: string;
    name: string;
    id: string;
  };
  isAdmin?: boolean;
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
            <Link href="/leaderboard" className="d-btn d-btn-ghost">
              排行榜
            </Link>
            {isAdmin && (
              <Link href="/admin" className="d-btn d-btn-ghost">
                Admin
              </Link>
            )}
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
          <>
            <Link href="/leaderboard" className="d-btn d-btn-ghost">
              排行榜
            </Link>
            <a
              href={INVITE_URL}
              target="_blank"
              rel="noreferrer"
              className="d-btn d-btn-discord"
            >
              <DiscordMark className="dc" /> 加入 Discord
            </a>
          </>
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
  | "lottery"
  | "backpack"
  | "farm"
  | "quests"
  | "guild"
  | "stocks"
  | "badges";

const DASH_TABS: { id: DashTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "backpack", label: "背包" },
  { id: "farm", label: "農場" },
  { id: "quests", label: "任務" },
  { id: "guild", label: "公會" },
  { id: "stocks", label: "股票" },
  { id: "badges", label: "稱號" },
  { id: "transactions", label: "金流" },
  { id: "tax", label: "稅務" },
  { id: "invites", label: "邀請" },
  { id: "lottery", label: "樂透" },
];

function PageHead({
  stamps,
  activeTab,
}: {
  stamps?: { v: string; k: string }[];
  activeTab?: DashTab;
}) {
  return (
    <header className="d-page-head">
      <div className="d-page-head-left">
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
      v: fmtTimeOfDay(now),
      k: "Time",
    },
    {
      v: now.toLocaleDateString("en-US", {
        timeZone: "Asia/Taipei",
        month: "short",
        day: "numeric",
      }),
      k: "Today",
    },
  ];

  if (!session) {
    return (
      <div className="d-app">
        <div className="d-app-frame">
          <TopNav />
          <PageHead stamps={stamps} />
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
  const isAdmin = await isCurrentUserAdmin();

  return (
    <div className="d-app">
      <div className="d-app-frame">
        <TopNav
          isAdmin={isAdmin}
          identity={{
            avatar: avatarUrl(session),
            name: displayName,
            id: session.id,
          }}
        />
        <PageHead stamps={stamps} activeTab={tab} />

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
        {tab === "lottery" && (
          <LotteryTab session={session} guildId={guildId} />
        )}
        {tab === "backpack" && (
          <BackpackTab session={session} guildId={guildId} />
        )}
        {tab === "farm" && (
          <FarmTab session={session} guildId={guildId} />
        )}
        {tab === "quests" && (
          <QuestsTab session={session} guildId={guildId} />
        )}
        {tab === "guild" && (
          <GuildTab session={session} guildId={guildId} />
        )}
        {tab === "stocks" && (
          <StocksTab session={session} guildId={guildId} />
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
            <Link href="/leaderboard">排行榜</Link>
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
  const [coin, level, mining, donations, buffs, buffSrc, club] = guildId
    ? await Promise.all([
        getCoinSummary(session.id, guildId),
        getLevelSummary(session.id, guildId),
        getMiningSummary(session.id, guildId),
        getDonationHistory(session.id, guildId, 10),
        getActiveBuffs(session.id, guildId),
        getProfileBuffSources(session.id, guildId),
        getGuildClubMembership(session.id, guildId),
      ])
    : [null, null, null, [], null, null, null];

  const clubInfo = club === "no_membership" ? null : club;

  return (
    <>
      {guildId && coin === null && <DataUnavailable />}

      {guildId && coin && level && mining && (
        <>
          <HeroRow coin={coin} level={level} mining={mining} />
          <StatRow level={level} />
          <BuffsCard
            shopBuffs={buffs ?? []}
            foodBuffs={buffSrc?.food ?? []}
            donorLuck={buffSrc?.donorLuck ?? null}
            club={clubInfo}
          />
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
  return fmtShortDateTime(d);
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

// ── 稅務 / 邀請 / 樂透 ────────────────────────────────────────────────────

function asTaxPeriod(v: string | undefined): TaxHistoryPeriod {
  return v === "month" || v === "year" ? v : "all";
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
  const [bag, eq, food] = await Promise.all([
    getBackpack(session.id, guildId),
    getEquipment(session.id, guildId),
    getFoodStockpile(session.id, guildId),
  ]);
  if (!bag || !eq) return <DataUnavailable />;
  return (
    <>
      <SectionTitle title="裝備" en="EQUIPMENT" />
      <EquipmentView eq={eq} />
      <BackpackView bag={bag} />
      {food && <FoodStockpileView food={food} />}
    </>
  );
}

function freshnessTone(f: number): { tag: string; label: string } {
  if (f >= 0.8) return { tag: "🟢", label: "新鮮" };
  if (f >= 0.5) return { tag: "🟡", label: "普通" };
  if (f >= 0.2) return { tag: "🟠", label: "偏舊" };
  return { tag: "🔴", label: "快壞了" };
}

function FoodStockpileView({ food }: { food: FoodStockpile }) {
  const avgPct = Math.round(food.avgFreshness * 100);
  return (
    <>
      <SectionTitle title="食物倉庫" en="FOOD STOCKPILE" />
      {food.total === 0 ? (
        <div className="d-empty">
          {food.spoiledPending > 0
            ? `倉庫裡只剩 ${food.spoiledPending} 份腐壞的食物（下次在 Discord 開 /食物 會自動轉成廚餘堆肥）`
            : "倉庫是空的。到 Discord 用 /烹飪 做幾份囤起來吧。"}
        </div>
      ) : (
        <>
          <div className="d-grid-3">
            <div className="d-card d-card-feature">
              <CardHead title="目前持有" sub="TOTAL" />
              <div className="d-card-body">
                <div className="d-num-xl">{fmt(food.total)}</div>
                <span className="d-feature-meta" style={{ marginTop: 6 }}>
                  份
                </span>
              </div>
            </div>
            <div className="d-card">
              <CardHead title="平均新鮮度" sub="AVG FRESHNESS" />
              <div className="d-card-body">
                <div className="d-num-md">
                  {freshnessTone(food.avgFreshness).tag} {avgPct}%
                </div>
                <div className="d-bar" style={{ marginTop: 14 }}>
                  <span style={{ width: `${avgPct}%` }} />
                </div>
              </div>
            </div>
            <div className="d-card">
              <CardHead
                title={food.urgentCount > 0 ? "快壞了" : "腐壞待清"}
                sub="ATTENTION"
              />
              <div className="d-card-body">
                <div className="d-num-md">
                  {food.urgentCount > 0
                    ? `🔴 ${food.urgentCount} 份`
                    : food.spoiledPending > 0
                      ? `🗑 ${food.spoiledPending} 份`
                      : "—"}
                </div>
                <span className="d-feature-meta" style={{ marginTop: 6 }}>
                  {food.urgentCount > 0
                    ? "新鮮度 < 20%"
                    : food.spoiledPending > 0
                      ? "下次開 /食物 會轉堆肥"
                      : "全部都還很新鮮"}
                </span>
              </div>
            </div>
          </div>
          <div className="d-card">
            <div className="d-row-list">
              {food.groups.map((g) => {
                const def = RECIPES[g.recipeId];
                const oldTone = freshnessTone(g.oldestFreshness);
                const oldPct = Math.round(g.oldestFreshness * 100);
                const newPct = Math.round(g.newestFreshness * 100);
                const rangeText =
                  g.count === 1
                    ? `${oldTone.tag} ${oldPct}%（${oldTone.label}）`
                    : `${oldTone.tag} ${oldPct}% ─ ${newPct}%`;
                return (
                  <div key={g.recipeId} className="d-list-row">
                    <span className="d-list-key">
                      <span className="d-emoji">{def?.emoji ?? "🍽️"}</span>
                      {def?.name ?? g.recipeId}
                      {g.useCoal && (
                        <span className="d-row-sub"> · 🔥 煤炭烤製</span>
                      )}
                      <div className="d-row-sub" style={{ marginTop: 2 }}>
                        {rangeText}
                        {def?.buffLabel && ` · ${def.buffLabel}`}
                      </div>
                    </span>
                    <span className="d-list-val">×{fmt(g.count)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="d-notice">
            食物新鮮度會隨時間衰減：剛煮好 12 小時內 100%，之後線性降到 0；
            7 天後（煤炭烤製 ×{FOOD_STORAGE.coalMultiplier} 倍時間）變廚餘堆肥。
            食用時 Discord 端會以「當下新鮮度」乘上效果。完整食用流程請到{" "}
            <code>/食物</code>。
          </p>
        </>
      )}
    </>
  );
}

function BackpackView({ bag }: { bag: BackpackSummary }) {
  const oreEntries = Object.entries(ORES);
  const fishEntries = Object.entries(FISH);
  const cropEntries = Object.entries(CROPS);
  const seedEntries = Object.entries(SEEDS);
  const fertEntries = Object.entries(FERTILIZERS);
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

      <SectionTitle title="菜袋・種子・肥料" en="FARM SUPPLIES" />
      <div className="d-grid-2-eq">
        <div className="d-card">
          <CardHead title="菜袋" sub="VEGGIE BAG" />
          <div className="d-row-list">
            {cropEntries.map(([id, info]) => (
              <div key={id} className="d-list-row">
                <span className="d-list-key">
                  <span className="d-emoji">{info.emoji}</span>
                  {info.name}
                </span>
                <span className="d-list-val">
                  {fmt(bag.veggieBag[id] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="d-card">
          <CardHead title="種子袋" sub="SEEDS" />
          <div className="d-row-list">
            {seedEntries.map(([id, info]) => (
              <div key={id} className="d-list-row">
                <span className="d-list-key">
                  <span className="d-emoji">{info.emoji}</span>
                  {info.name}
                </span>
                <span className="d-list-val">{fmt(bag.seedBag[id] ?? 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="d-card">
        <CardHead title="肥料 & 雜物" sub="FERTILIZERS" />
        <div className="d-row-list">
          {fertEntries.map(([id, info]) => (
            <div key={id} className="d-list-row">
              <span className="d-list-key">
                <span className="d-emoji">{info.emoji}</span>
                {info.name}
              </span>
              <span className="d-list-val">
                {fmt(bag.fertilizers[id] ?? 0)}
              </span>
            </div>
          ))}
          <div className="d-list-row">
            <span className="d-list-key">
              <span className="d-emoji">🪱</span>
              稀有魚餌
            </span>
            <span className="d-list-val">{fmt(bag.rareBait)}</span>
          </div>
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

function BuffsCard({
  shopBuffs,
  foodBuffs,
  donorLuck,
  club,
}: {
  shopBuffs: ActiveBuff[];
  foodBuffs: FoodBuff[];
  donorLuck: DonorLuckBuff | null;
  club: GuildClubInfo | null;
}) {
  const xpMax = maxMult(shopBuffs.filter((b) => b.type === "xp_boost"));
  const coinMax = maxMult(shopBuffs.filter((b) => b.type === "coin_boost"));
  const hasAny =
    shopBuffs.length > 0 ||
    foodBuffs.length > 0 ||
    !!donorLuck ||
    (club && club.buffs.length > 0);

  return (
    <div className="d-card d-buffs-card">
      <CardHead title="生效中加成" sub="ACTIVE BUFFS" />
      <div className="d-card-body">
        <div className="d-buffs-mults">
          <div className="d-buffs-mult">
            <span className="d-buffs-mult-lab">XP</span>
            <span className="d-buffs-mult-val">×{xpMax.toFixed(2)}</span>
          </div>
          <div className="d-buffs-mult">
            <span className="d-buffs-mult-lab">金幣</span>
            <span className="d-buffs-mult-val">×{coinMax.toFixed(2)}</span>
          </div>
        </div>
        {!hasAny ? (
          <div className="d-buffs-empty">
            沒有生效中的加成。完整加成（挖礦、釣魚、食物、身分組）請用 Discord{" "}
            <code>/加成</code>。
          </div>
        ) : (
          <ul className="d-buffs-list">
            {shopBuffs.map((b, i) => {
              const def = b.source ? SHOP_ITEMS[b.source] : null;
              return (
                <li
                  key={`shop-${b.source ?? "x"}-${b.expiresAt.getTime()}-${i}`}
                  className="d-buffs-row"
                >
                  <span className="d-buffs-row-name">
                    {def?.emoji ?? "🧪"} {def?.name ?? b.source ?? "—"}
                  </span>
                  <span className="d-buffs-row-mult mono">
                    ×{b.multiplier.toFixed(2)}
                  </span>
                  <span className="d-buffs-row-exp">
                    {fmtTxTime(b.expiresAt)}
                  </span>
                </li>
              );
            })}
            {donorLuck && (
              <li className="d-buffs-row">
                <span className="d-buffs-row-name">
                  💖 贊助幸運加成
                </span>
                <span className="d-buffs-row-mult mono">
                  🍀 +{Math.round(donorLuck.bonus * 100)}%
                </span>
                <span className="d-buffs-row-exp">
                  {fmtTxTime(donorLuck.expiresAt)}
                </span>
              </li>
            )}
            {foodBuffs.map((b, i) => {
              const label = FOOD_BUFF_TYPE_LABELS[b.type] ?? `🍱 ${b.type}`;
              const valLabel =
                b.type === "dungeon_atk"
                  ? `+${fmt(Math.round(b.value))}`
                  : `+${Math.round(b.value * 100)}%`;
              const expLabel = b.expiresAt
                ? fmtTxTime(b.expiresAt)
                : b.usesLeft != null
                  ? `剩 ${b.usesLeft} 次`
                  : "—";
              return (
                <li
                  key={`food-${b.type}-${i}`}
                  className="d-buffs-row"
                >
                  <span className="d-buffs-row-name">{label}</span>
                  <span className="d-buffs-row-mult mono">{valLabel}</span>
                  <span className="d-buffs-row-exp">{expLabel}</span>
                </li>
              );
            })}
            {club &&
              club.buffs.map((b, i) => (
                <li key={`club-${b.type}-${i}`} className="d-buffs-row">
                  <span className="d-buffs-row-name">
                    🏛️ {club.name}・Lv.{club.level}
                  </span>
                  <span className="d-buffs-row-mult mono">
                    {guildClubBuffLabel(b)}
                  </span>
                  <span className="d-buffs-row-exp">公會</span>
                </li>
              ))}
          </ul>
        )}
        <p
          className="d-notice"
          style={{ marginTop: 12, marginBottom: 0 }}
        >
          身分組類加成（Twitch 訂閱、伺服器加成 Booster）以 Discord 內{" "}
          <code>/加成</code> 顯示為準，網站無法讀取你目前的身分組清單。
        </p>
      </div>
    </div>
  );
}

async function QuestsTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const [status, assignment] = await Promise.all([
    getQuestStatus(session.id, guildId),
    getQuestAssignment(session.id, guildId),
  ]);
  if (!status || !assignment) return <DataUnavailable />;
  return <QuestsView status={status} assignment={assignment} />;
}

function QuestsView({
  status,
  assignment,
}: {
  status: QuestStatus;
  assignment: QuestAssignmentBundle;
}) {
  const isAssigned = (tier: "daily" | "weekly", id: string) =>
    assignment[tier].questIds.includes(id);
  const isSkipped = (tier: "daily" | "weekly", id: string) =>
    assignment[tier].skippedIds.includes(id);

  const assignedReady = [
    ...status.daily.filter((q) => isAssigned("daily", q.questId) && !isSkipped("daily", q.questId)),
    ...status.weekly.filter((q) => isAssigned("weekly", q.questId) && !isSkipped("weekly", q.questId)),
  ].filter((q) => q.state === "ready").length;

  return (
    <>
      {assignedReady > 0 && (
        <div className="d-empty d-my-rank" style={{ textAlign: "left" }}>
          有 <strong>{assignedReady}</strong> 個任務剛完成、等待自動入帳。如未到帳，請到
          Discord 按「領錢」按鈕補領。
        </div>
      )}

      <SectionTitle title="🌞 每日任務" en="DAILY" />
      <AssignmentHeader assignment={assignment.daily} />
      <QuestAssignmentList
        tier="daily"
        defs={DAILY_QUESTS}
        rows={status.daily}
        assignment={assignment.daily}
      />

      <SectionTitle title="📅 週常任務" en="WEEKLY" />
      <AssignmentHeader assignment={assignment.weekly} />
      <QuestAssignmentList
        tier="weekly"
        defs={WEEKLY_QUESTS}
        rows={status.weekly}
        assignment={assignment.weekly}
      />

      <p className="d-notice">
        任務改為「抽選制」：每期玩家只會被指派少數任務，不再全部開放。重抽 / 跳過需要花費金幣，
        且每期共有上限。操作（重抽、跳過、領錢）請到 Discord 用 <code>/逼幣任務</code>。
      </p>
    </>
  );
}

function AssignmentHeader({ assignment }: { assignment: QuestAssignment }) {
  const actionsLeft = Math.max(
    0,
    assignment.actionLimit - assignment.rerollsUsed - assignment.skipsUsed,
  );
  const empty = assignment.questIds.length === 0;
  if (empty) {
    return (
      <div className="d-empty" style={{ textAlign: "left" }}>
        本期還沒指派任何任務。到 Discord 用 <code>/逼幣任務</code>{" "}
        會自動為你抽選一批可挑戰的任務。
      </div>
    );
  }
  return (
    <div className="d-card d-card-small" style={{ marginBottom: 12 }}>
      <div className="d-row between" style={{ flexWrap: "wrap", gap: 8 }}>
        <span className="d-kicker">
          本期已指派 <strong>{assignment.questIds.length}</strong> 個任務
          {assignment.skippedIds.length > 0 && (
            <>　・　跳過 <strong>{assignment.skippedIds.length}</strong></>
          )}
        </span>
        <span className="d-kicker mono">
          剩餘行動 {actionsLeft} / {assignment.actionLimit}　・　重抽 {fmt(assignment.rerollCost)} 幣　・　跳過 {fmt(assignment.skipCost)} 幣
        </span>
      </div>
    </div>
  );
}

function QuestAssignmentList({
  tier,
  defs,
  rows,
  assignment,
}: {
  tier: "daily" | "weekly";
  defs: QuestDef[];
  rows: QuestStateRow[];
  assignment: QuestAssignment;
}) {
  void tier;
  if (assignment.questIds.length === 0) return null;
  const byId = new Map(rows.map((r) => [r.questId, r]));
  const defById = new Map(defs.map((d) => [d.id, d]));
  // 顯示順序：assignment.questIds（未跳過）→ skippedIds
  const orderedActive = assignment.questIds.filter(
    (id) => !assignment.skippedIds.includes(id),
  );
  return (
    <div className="d-quests">
      {orderedActive.map((id) => {
        const def = defById.get(id);
        if (!def) return null;
        return <QuestCard key={id} def={def} row={byId.get(id)} />;
      })}
      {assignment.skippedIds.map((id) => {
        const def = defById.get(id);
        if (!def) return null;
        return <QuestCard key={`sk-${id}`} def={def} row={byId.get(id)} skipped />;
      })}
    </div>
  );
}

function QuestCard({
  def,
  row,
  skipped = false,
}: {
  def: QuestDef;
  row?: QuestStateRow;
  skipped?: boolean;
}) {
  const r =
    row ?? {
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
  const stateLabel = skipped
    ? "已跳過"
    : r.state === "claimed"
      ? "已領取"
      : r.state === "ready"
        ? "待入帳"
        : r.state === "in_progress"
          ? "進行中"
          : "未開始";
  return (
    <div
      className={
        "d-quest" +
        (r.state === "ready" && !skipped ? " d-quest-ready" : "") +
        (skipped ? " d-quest-skipped" : "")
      }
      style={skipped ? { opacity: 0.55 } : undefined}
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
}

// ── 農場 / 公會 / 股票 ───────────────────────────────────────────────────────

async function FarmTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const farm = await getFarmStatus(session.id, guildId);
  if (!farm) return <DataUnavailable />;
  return <FarmView farm={farm} />;
}

function fmtDuration(ms: number): string {
  if (ms <= 0) return "0 分";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} 分`;
  if (m === 0) return `${h} 時`;
  return `${h} 時 ${m} 分`;
}

function FarmView({ farm }: { farm: FarmStatus }) {
  const readyCount = farm.plots.filter((p) => p.status === "ready").length;
  const growingCount = farm.plots.filter((p) => p.status === "growing").length;
  return (
    <>
      <div className="d-grid-3">
        <div className="d-card d-card-feature">
          <CardHead title="田地" sub="PLOTS" />
          <div className="d-card-body">
            <div className="d-num-xl">
              {fmt(farm.plotCount)}
              <span className="d-num-unit"> / 8</span>
            </div>
            <span className="d-feature-meta" style={{ marginTop: 6 }}>
              當前持有田地
            </span>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="可收成" sub="READY" />
          <div className="d-card-body">
            <div className="d-num-md">
              {readyCount > 0 ? `✨ ${readyCount}` : "—"}
            </div>
            <div className="d-kbd">塊</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="成長中" sub="GROWING" />
          <div className="d-card-body">
            <div className="d-num-md">
              {growingCount > 0 ? `🌿 ${growingCount}` : "—"}
            </div>
            <div className="d-kbd">塊</div>
          </div>
        </div>
      </div>

      <div className="d-grid-3">
        <div className="d-card">
          <CardHead title="累計種植" sub="PLANTED" />
          <div className="d-card-body">
            <div className="d-num-md">{fmt(farm.plantTotal)}</div>
            <div className="d-kbd">次</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="累計收成" sub="HARVESTED" />
          <div className="d-card-body">
            <div className="d-num-md">{fmt(farm.harvestTotal)}</div>
            <div className="d-kbd">次</div>
          </div>
        </div>
      </div>

      <SectionTitle title="田地狀態" en="PLOT STATUS" />
      <div className="d-card">
        <div className="d-row-list">
          {farm.plots.map((p) => {
            const def = p.crop ? CROPS[p.crop] : null;
            const status = CROP_STATUS_LABELS[p.status];
            const fert = p.fertilizer ? FERTILIZERS[p.fertilizer] : null;
            const remainLabel =
              p.status === "growing"
                ? `成熟還需 ${fmtDuration(p.remainingMs)}`
                : p.status === "ready"
                  ? `腐爛還剩 ${fmtDuration(p.remainingMs)}`
                  : null;
            return (
              <div key={p.plotIndex} className="d-list-row">
                <span className="d-list-key">
                  <span className="d-emoji">
                    {def?.emoji ?? status.tag}
                  </span>
                  田 #{p.plotIndex + 1}
                  <div className="d-row-sub" style={{ marginTop: 2 }}>
                    {def ? (
                      <>
                        {def.name}・{status.label}
                        {fert && <> ・施肥 {fert.emoji}{fert.name}</>}
                        {remainLabel && <> ・{remainLabel}</>}
                      </>
                    ) : (
                      "空地（可種植）"
                    )}
                  </div>
                </span>
                <span className="d-list-val">{status.tag}</span>
              </div>
            );
          })}
        </div>
      </div>

      <SectionTitle title="作物圖鑑" en="CROPS" />
      <div className="d-grid-2-eq">
        {Object.entries(CROPS).map(([id, def]) => (
          <div key={id} className="d-card">
            <CardHead
              title={`${def.emoji} ${def.name}`}
              sub={`${fmtDuration(def.growMs)} 成熟`}
            />
            <div className="d-card-body">
              <div className="d-kbd">種植費 {fmt(def.plantCost)} 幣</div>
              <div className="d-kbd">
                收成 {fmt(def.payout[0])} ~ {fmt(def.payout[1])} 幣・賣價 {fmt(def.sellPrice)} 幣
              </div>
              <div className="d-kbd">
                {def.seedKey
                  ? def.seedOptional
                    ? `可消耗種子（${SEEDS[def.seedKey]?.name}）省種植費`
                    : `需消耗種子（${SEEDS[def.seedKey]?.name}）`
                  : "免種子"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="d-notice">
        所有種植 / 施肥 / 收成 / 設陷阱操作請到 Discord 使用 <code>/農場</code>。
        作物腐爛後就無法收成，請留意「腐爛還剩」時間。
      </p>
    </>
  );
}

async function GuildTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const club = await getGuildClubMembership(session.id, guildId);
  if (club === null) return <DataUnavailable />;
  if (club === "no_membership") {
    return (
      <div className="d-empty">
        你還沒加入任何公會。
        <br />
        要加入或建立公會請到 Discord 用 <code>/公會</code>。
      </div>
    );
  }
  return <GuildView club={club} />;
}

function GuildView({ club }: { club: GuildClubInfo }) {
  const progressPct =
    club.nextLevel && club.nextLevel.threshold > 0
      ? Math.min(
          100,
          Math.round((club.myContribution / club.nextLevel.threshold) * 100),
        )
      : 100;
  return (
    <>
      <div className="d-grid-3">
        <div className="d-card d-card-feature">
          <CardHead
            title={`🏛️ ${club.name}`}
            sub={`Lv.${club.level}`}
          />
          <div className="d-card-body">
            <div className="d-num-md">
              {club.memberCount}
              <span className="d-num-unit"> / {club.maxMembers}</span>
            </div>
            <span className="d-feature-meta" style={{ marginTop: 6 }}>
              成員數
            </span>
            <div className="d-kbd" style={{ marginTop: 10 }}>
              身分：{GUILD_CLUB_ROLE_LABELS[club.myRole] ?? club.myRole}
            </div>
            {club.description && (
              <div className="d-kbd">「{club.description}」</div>
            )}
          </div>
        </div>
        <div className="d-card">
          <CardHead title="公會金庫" sub="TREASURY" />
          <div className="d-card-body">
            <div className="d-num-md">{fmt(club.treasury)}</div>
            <div className="d-kbd">幣</div>
            {club.treasuryLocked > 0 && (
              <div className="d-kbd">鎖定中 {fmt(club.treasuryLocked)}</div>
            )}
          </div>
        </div>
        <div className="d-card">
          <CardHead title="我的貢獻" sub="MY CONTRIBUTION" />
          <div className="d-card-body">
            <div className="d-num-md">{fmt(club.myContribution)}</div>
            <div className="d-kbd">幣</div>
            {club.joinedAt && (
              <div className="d-kbd">加入 {fmtTxTime(club.joinedAt)}</div>
            )}
          </div>
        </div>
      </div>

      {club.nextLevel && (
        <div className="d-card">
          <CardHead
            title={`升級至 Lv.${club.nextLevel.level}`}
            sub="NEXT LEVEL"
          />
          <div className="d-card-body">
            <div className="d-row between" style={{ marginBottom: 8 }}>
              <span className="d-kicker mono">
                {fmt(club.myContribution)} / {fmt(club.nextLevel.threshold)} 貢獻
              </span>
              <span className="d-kicker mono">{progressPct}%</span>
            </div>
            <div className="d-bar d-bar-accent">
              <span style={{ width: `${progressPct}%` }} />
            </div>
            <div className="d-kbd" style={{ marginTop: 10 }}>
              升級後上限 {club.nextLevel.maxMembers} 人・新增 buff{" "}
              {club.nextLevel.buffs.length} 個
            </div>
          </div>
        </div>
      )}

      <SectionTitle title="目前等級 BUFF" en="ACTIVE GUILD BUFFS" />
      {club.buffs.length === 0 ? (
        <div className="d-empty">
          公會等級 Lv.{club.level} 目前沒有額外 buff，提升等級即可解鎖。
        </div>
      ) : (
        <div className="d-card">
          <div className="d-row-list">
            {club.buffs.map((b, i) => (
              <div key={`${b.type}-${i}`} className="d-list-row">
                <span className="d-list-key">{guildClubBuffLabel(b)}</span>
                <span className="d-list-val mono">+{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionTitle title="等級門檻" en="LEVEL TABLE" />
      <div className="d-table-wrap">
        <table className="d-tbl">
          <thead>
            <tr>
              <th>等級</th>
              <th>累計貢獻</th>
              <th>成員上限</th>
              <th>Buff 數</th>
            </tr>
          </thead>
          <tbody>
            {GUILD_CLUB_LEVELS.map((lv) => (
              <tr
                key={lv.level}
                style={
                  lv.level === club.level
                    ? { background: "rgba(255,255,255,0.04)" }
                    : undefined
                }
              >
                <td className="mono">Lv.{lv.level}</td>
                <td className="mono">{fmt(lv.threshold)}</td>
                <td className="mono">{lv.maxMembers}</td>
                <td className="mono">{lv.buffs.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="d-notice">
        詳細公會操作（招募、踢人、捐獻、解散、領取週任務獎勵）請到 Discord 用{" "}
        <code>/公會</code>。
      </p>
    </>
  );
}

async function StocksTab({
  session,
  guildId,
}: {
  session: { id: string };
  guildId: string | null;
}) {
  if (!guildId) return null;
  const port = await getStockPortfolio(session.id, guildId);
  if (!port) return <DataUnavailable />;
  return <StocksView portfolio={port} />;
}

function StocksView({ portfolio }: { portfolio: StockPortfolio }) {
  if (portfolio.positions.length === 0) {
    return (
      <>
        <div className="d-empty">
          你目前沒有持倉。到 Discord 用 <code>/股票</code> 看行情、買股。
        </div>
        <SectionTitle title="可交易股票" en="LISTED" />
        <StockListedGrid />
      </>
    );
  }
  const totalPct =
    portfolio.totalCost > 0
      ? portfolio.totalUnrealized / portfolio.totalCost
      : 0;
  return (
    <>
      <div className="d-grid-3">
        <div className="d-card d-card-feature">
          <CardHead title="持倉市值" sub="MARKET VALUE" />
          <div className="d-card-body">
            <div className="d-num-xl">{fmt(Math.round(portfolio.totalValue))}</div>
            <span className="d-feature-meta" style={{ marginTop: 6 }}>
              幣（以最新收盤價估）
            </span>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="持倉成本" sub="COST" />
          <div className="d-card-body">
            <div className="d-num-md">{fmt(Math.round(portfolio.totalCost))}</div>
            <div className="d-kbd">幣</div>
          </div>
        </div>
        <div className="d-card">
          <CardHead title="未實現損益" sub="UNREALIZED" />
          <div className="d-card-body">
            <div
              className={
                "d-num-md " +
                (portfolio.totalUnrealized >= 0 ? "d-tx-pos" : "d-tx-neg")
              }
            >
              {portfolio.totalUnrealized >= 0 ? "+" : ""}
              {fmt(Math.round(portfolio.totalUnrealized))}
            </div>
            <div className="d-kbd">
              {portfolio.totalUnrealized >= 0 ? "+" : ""}
              {(totalPct * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <SectionTitle title="持倉" en="POSITIONS" />
      <div className="d-table-wrap">
        <table className="d-tbl">
          <thead>
            <tr>
              <th>標的</th>
              <th className="num">股數</th>
              <th className="num">均價</th>
              <th className="num">現價</th>
              <th className="num">市值</th>
              <th className="num">損益</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.positions.map((p) => {
              const def = STOCKS[p.symbol];
              return (
                <tr key={p.symbol}>
                  <td>
                    <span className="mono">{p.symbol}</span>
                    {def && <span className="d-row-sub"> · {def.name}</span>}
                  </td>
                  <td className="num">{fmt(p.shares)}</td>
                  <td className="num">{p.avgCost.toFixed(2)}</td>
                  <td className="num">
                    {p.currentPrice == null ? "—" : p.currentPrice.toFixed(2)}
                  </td>
                  <td className="num">{fmt(Math.round(p.marketValue))}</td>
                  <td
                    className={
                      "num " +
                      (p.unrealized >= 0 ? "d-tx-pos" : "d-tx-neg")
                    }
                  >
                    {p.unrealized >= 0 ? "+" : ""}
                    {fmt(Math.round(p.unrealized))}
                    {p.unrealizedPct !== null && (
                      <span className="d-row-sub">
                        {" "}
                        ({p.unrealizedPct >= 0 ? "+" : ""}
                        {(p.unrealizedPct * 100).toFixed(2)}%)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SectionTitle title="可交易股票" en="LISTED" />
      <StockListedGrid />

      <p className="d-notice">
        市場開盤時間 09:00–21:00（Asia/Taipei），每 5 分鐘 tick 一次。買賣 / 看
        K 線 / 訂閱事件請到 Discord 用 <code>/股票</code>。
      </p>
    </>
  );
}

function StockListedGrid() {
  return (
    <div className="d-grid-3">
      {Object.values(STOCKS).map((s) => (
        <div key={s.symbol} className="d-card">
          <CardHead title={`${s.name}`} sub={s.symbol} />
          <div className="d-card-body">
            <div className="d-kbd">
              {STOCK_TYPE_LABELS[s.type] ?? s.type}
            </div>
            <div className="d-kbd">
              IPO 價 {fmt(s.initialPrice)} 幣
            </div>
            <div className="d-kbd">
              年化股息{" "}
              {s.dividendYield > 0
                ? `${(s.dividendYield * 100).toFixed(1)}%`
                : "—"}
            </div>
          </div>
        </div>
      ))}
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
    { label: "種植次數", value: mining.farmCountTotal },
    { label: "收成次數", value: mining.farmHarvestTotal },
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
  const cropEntries = Object.entries(CROPS);
  const seedEntries = Object.entries(SEEDS);
  return (
    <>
      <SectionTitle title="挖礦・釣魚・農場收穫" en="HARVEST" />
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
      <div className="d-grid-2-eq">
        <div className="d-card">
          <CardHead title="菜袋（持有中）" sub="VEGGIE BAG" />
          <div className="d-row-list">
            {cropEntries.map(([id, info]) => (
              <div key={id} className="d-list-row">
                <span className="d-list-key">
                  <span className="d-emoji">{info.emoji}</span>
                  {info.name}
                </span>
                <span className="d-list-val">
                  {fmt(mining.veggieBag[id] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="d-card">
          <CardHead title="種子袋" sub="SEEDS" />
          <div className="d-row-list">
            {seedEntries.map(([id, info]) => (
              <div key={id} className="d-list-row">
                <span className="d-list-key">
                  <span className="d-emoji">{info.emoji}</span>
                  {info.name}
                </span>
                <span className="d-list-val">
                  {fmt(mining.seedBag[id] ?? 0)}
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
