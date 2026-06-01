import Link from "next/link";
import DonateNav from "../donate/_components/donate-nav";
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

export default async function DashboardPage() {
  const session = await readSession();

  if (!session) {
    return (
      <>
        <DonateNav active="/dashboard" />
        <div className="donate-shell">
          <div className="donate-panel">
            <div className="donate-panel-header">
              <h1>儀表板</h1>
              <span className="crumb">/ dashboard</span>
            </div>
            <div className="donate-body">
              <div className="dash-login">
                <span className="dash-readonly-tag">read-only</span>
                <h2>先用 Discord 登入</h2>
                <p>
                  儀表板會顯示你在伺服器的金幣、等級、挖礦／釣魚紀錄與贊助歷史。
                  目前只開放查看，所有操作仍請在 Discord 內以斜線指令進行。
                </p>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler, not a page */}
                <a
                  href="/api/auth/discord/login?next=/dashboard"
                  className="donate-btn discord"
                >
                  <DiscordLogo /> 使用 Discord 登入
                </a>
                <p style={{ fontSize: 12 }}>
                  僅取得 <code>identify</code> 權限（你的 ID、使用者名稱、頭像）。
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const guildId = getPrimaryGuildId();

  // 沒設 PRIMARY_GUILD_ID 也照樣顯示個人卡，但所有來自 bot DB 的區塊收起。
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
      <DonateNav active="/dashboard" />
      <div className="donate-shell">
        <div className="donate-panel">
          <div className="donate-panel-header">
            <h1>儀表板</h1>
            <span className="crumb">/ dashboard</span>
          </div>
          <div className="donate-body">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 8,
              }}
            >
              <div className="identity-card" style={{ flex: "0 0 auto" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="avatar"
                  src={avatarUrl(session)}
                  alt=""
                  width={44}
                  height={44}
                />
                <div className="who">
                  <span className="greeting">
                    你好，{session.globalName ?? session.username}
                  </span>
                  <span className="uid">id {session.id}</span>
                </div>
              </div>
              <span className="dash-readonly-tag">read-only</span>
              <form
                action="/api/auth/discord/logout"
                method="post"
                style={{ marginLeft: "auto", margin: 0 }}
              >
                <button type="submit" className="donate-btn ghost">
                  登出
                </button>
              </form>
            </div>

            {!guildId && <GuildNotConfigured />}
            {guildId && coin === null && <DataUnavailable />}

            {guildId && coin && level && mining && (
              <>
                <div className="section-label">總覽</div>
                <Overview coin={coin} level={level} mining={mining} />

                <div className="section-label">活動紀錄</div>
                <ActivityGrid level={level} mining={mining} />

                <div className="section-label">挖礦・釣魚收穫</div>
                <CollectionGrid mining={mining} />
              </>
            )}

            <div className="section-label">贊助紀錄</div>
            {donations.length === 0 ? (
              <div className="dash-empty">
                還沒有任何贊助紀錄。
                <Link
                  href="/donate"
                  style={{
                    marginLeft: 8,
                    color: "var(--color-feature)",
                    textDecoration: "underline",
                  }}
                >
                  前往贊助頁面 →
                </Link>
              </div>
            ) : (
              <DonationTable items={donations} />
            )}

            <p className="notice" style={{ marginTop: 20 }}>
              本頁僅顯示資料、不提供任何操作。所有指令（挖礦、釣魚、賣礦、抖內發放等）
              請於 Discord 內透過斜線指令完成。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Overview({
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
  return (
    <div className="dash-grid">
      <div className="dash-card feature">
        <span className="label">目前金幣</span>
        <span className="stat">{fmt(coin.totalCoins)}</span>
        <span className="sub">累積收入 {fmt(coin.lifetimeCoins)} 幣</span>
      </div>

      <div className="dash-card">
        <span className="label">等級</span>
        <span className="stat">Lv {level.level}</span>
        <div className="dash-progress">
          <span style={{ width: `${(level.progress * 100).toFixed(1)}%` }} />
        </div>
        <span className="sub">
          {fmt(level.currentLevelXp)} / {fmt(level.xpToNextLevel)} XP
          ・ 總 {fmt(level.totalXp)}
        </span>
      </div>

      <div className="dash-card">
        <span className="label">裝備</span>
        <div className="dash-kv-row">
          <span className="k">鎬子</span>
          <span className="v">{pickaxeName}</span>
        </div>
        <div className="dash-kv-row">
          <span className="k">釣竿</span>
          <span className="v">{rodName}</span>
        </div>
        <div className="dash-kv-row">
          <span className="k">體力</span>
          <span className="v">
            {mining.stamina === null ? "—" : fmt(mining.stamina)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ActivityGrid({
  level,
  mining,
}: {
  level: LevelSummary;
  mining: MiningSummary;
}) {
  const items: { label: string; value: number; sub?: string }[] = [
    { label: "挖礦次數", value: mining.mineCountTotal },
    { label: "釣魚次數", value: mining.fishCountTotal },
    { label: "打工次數", value: mining.workCountTotal },
    { label: "地下城通關", value: mining.dungeonCount },
    { label: "合成次數", value: mining.craftCountTotal },
    {
      label: "簽到",
      value: level.totalCheckins,
      sub: `連續 ${level.streak} 天・最長 ${level.longestStreak} 天`,
    },
    { label: "發言數", value: level.totalMessages },
    {
      label: "語音分鐘",
      value: level.totalVoiceMinutes,
    },
  ];
  return (
    <div className="dash-grid">
      {items.map((it) => (
        <div key={it.label} className="dash-card">
          <span className="label">{it.label}</span>
          <span className="stat">{fmt(it.value)}</span>
          {it.sub && <span className="sub">{it.sub}</span>}
        </div>
      ))}
    </div>
  );
}

function CollectionGrid({ mining }: { mining: MiningSummary }) {
  const oreEntries = Object.entries(ORE_NAMES);
  const fishEntries = Object.entries(FISH_NAMES);
  return (
    <div
      className="dash-grid"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
    >
      <div className="dash-card">
        <span className="label">累計挖到</span>
        {oreEntries.map(([id, info]) => (
          <div key={id} className="dash-kv-row">
            <span className="k">
              {info.emoji} {info.name}
            </span>
            <span className="v">{fmt(mining.lifetimeOre[id] ?? 0)}</span>
          </div>
        ))}
      </div>
      <div className="dash-card">
        <span className="label">魚袋（持有中）</span>
        {fishEntries.map(([id, info]) => (
          <div key={id} className="dash-kv-row">
            <span className="k">
              {info.emoji} {info.name}
            </span>
            <span className="v">{fmt(mining.fishBag[id] ?? 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonationTable({ items }: { items: DonationHistoryItem[] }) {
  return (
    <table className="dash-table">
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
            <td>
              {it.tierId
                ? TIER_NAMES[it.tierId] ?? it.tierId
                : "—"}
            </td>
            <td>{PLATFORM_NAMES[it.platform] ?? it.platform}</td>
            <td className="num">NT$ {fmt(it.amountNtd)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GuildNotConfigured() {
  return (
    <div className="dash-empty">
      尚未設定 <code>PRIMARY_GUILD_ID</code>，無法顯示個人遊戲資料。
      <br />
      請在伺服器環境變數中補上對應的 Discord 伺服器 ID。
    </div>
  );
}

function DataUnavailable() {
  return (
    <div className="dash-empty">
      目前無法連到資料庫（<code>MONGODB_URI_READONLY</code> 未設定或連線失敗）。
      <br />
      贊助以外的資料暫時無法顯示，請稍後重試。
    </div>
  );
}

function DiscordLogo() {
  return (
    <svg
      width="18"
      height="14"
      viewBox="0 0 71 55"
      fill="currentColor"
      aria-hidden
    >
      <path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.4a.2.2 0 0 0-.2.1c-.6 1.1-1.3 2.5-1.8 3.6a54 54 0 0 0-16.2 0c-.5-1.2-1.2-2.5-1.8-3.6a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.9 4.9a.2.2 0 0 0-.1.1C1.6 18.7-1 32 .3 45.2c0 .1 0 .2.1.2A58.9 58.9 0 0 0 18 54.4a.2.2 0 0 0 .2-.1l3.7-5.7a.2.2 0 0 0-.1-.3 38.8 38.8 0 0 1-5.5-2.7.2.2 0 0 1 0-.4c.4-.3.7-.5 1.1-.8a.2.2 0 0 1 .2 0 42 42 0 0 0 35.6 0c.1 0 .2 0 .2 0l1.1.9a.2.2 0 0 1 0 .3 36.4 36.4 0 0 1-5.5 2.7.2.2 0 0 0-.1.3l3.8 5.7c0 .1.1.2.2.1a58.7 58.7 0 0 0 17.7-9c0-.1.1-.1.1-.2 1.5-15.3-2.6-28.5-11-40.2a.1.1 0 0 0-.1-.1ZM23.7 37.2c-3.5 0-6.4-3.2-6.4-7.2 0-4 2.8-7.2 6.4-7.2 3.6 0 6.5 3.2 6.4 7.2 0 4-2.8 7.2-6.4 7.2Zm23.7 0c-3.5 0-6.4-3.2-6.4-7.2 0-4 2.8-7.2 6.4-7.2 3.6 0 6.5 3.2 6.4 7.2 0 4-2.8 7.2-6.4 7.2Z" />
    </svg>
  );
}
