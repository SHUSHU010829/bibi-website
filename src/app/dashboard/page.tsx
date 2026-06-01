import Link from "next/link";
import { readSession, avatarUrl } from "@/lib/donation/session";
import {
  getCoinSummary,
  getLevelSummary,
  getMiningSummary,
  getDonationHistory,
  getPrimaryGuildId,
  type CoinSummary,
  type LevelSummary,
  type MiningSummary,
  type DonationHistoryItem,
} from "@/lib/dashboard/profile";
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
            逼逼<em>機器人</em>
          </span>
        </Link>
        <div className="d-nav-links">
          <span className="d-nav-link active">DashBoard</span>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="d-nav-link"
          >
            首頁 <span className="arr">↗</span>
          </a>
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="d-nav-link"
          >
            查看文件 <span className="arr">↗</span>
          </a>
          <Link href="/donate" className="d-nav-link">
            抖內支持
          </Link>
        </div>
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

function PageHead({
  title,
  stamps,
}: {
  title: string;
  stamps?: { v: string; k: string }[];
}) {
  return (
    <header className="d-page-head">
      <div className="d-page-head-left">
        <h1>{title}</h1>
        <span className="d-crumb">/ dashboard</span>
      </div>
      <div className="d-page-head-right">
        {stamps?.map((s) => (
          <div className="d-stamp" key={s.k}>
            <span className="v">{s.v}</span>
            <span className="k">{s.k}</span>
          </div>
        ))}
        <span className="d-readonly">READ-ONLY</span>
      </div>
    </header>
  );
}

export default async function DashboardPage() {
  const session = await readSession();
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
              <span className="d-readonly">READ-ONLY</span>
              <h2>
                先用 <em>Discord</em> 登入
              </h2>
              <p>
                儀表板會顯示你在伺服器的金幣、等級、挖礦／釣魚紀錄與贊助歷史。
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

  const [coin, level, mining, donations] = guildId
    ? await Promise.all([
        getCoinSummary(session.id, guildId),
        getLevelSummary(session.id, guildId),
        getMiningSummary(session.id, guildId),
        getDonationHistory(session.id, guildId, 10),
      ])
    : [null, null, null, []];

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
        <PageHead title="儀表板" stamps={stamps} />

        <div className="d-greeting">
          <div className="d-greeting-text">
            <span className="d-greeting-hi">你好，</span>
            <span className="d-greeting-name">{displayName}</span>
          </div>
          <span className="d-uid">id {session.id}</span>
        </div>

        {!guildId && <GuildNotConfigured />}
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
