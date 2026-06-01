import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublicProfile, type PublicProfile } from "@/lib/profile/publicApi";
import { ORES, FISH } from "@/lib/dashboard/botDefs";

export const dynamic = "force-dynamic";
export const revalidate = 120;

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const result = await fetchPublicProfile(userId);
  if (result.kind !== "ok") {
    return { title: "玩家卡片 — 逼逼機器人" };
  }
  const { user, level } = result.data;
  return {
    title: `${user.displayName} · Lv.${level.level} — 逼逼機器人`,
    description: `${user.displayName} 在逼逼伺服器的公開卡片：Lv.${level.level}、累計收入 ${fmt(result.data.coin.lifetime)} 幣。`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const result = await fetchPublicProfile(userId);

  if (result.kind === "not_found") notFound();

  return (
    <div className="dash-root dark">
      <div className="d-app">
        <div className="d-app-frame">
          <nav className="d-topnav">
            <div className="d-brand-row">
              <Link href="/" className="d-logo" aria-label="逼逼機器人 — 回首頁">
                <span className="mark">BB</span>
                <span className="bn">
                  PRO<em>FILE</em>
                </span>
              </Link>
            </div>
            <div className="d-account">
              <Link href="/leaderboard" className="d-btn d-btn-ghost">
                排行榜
              </Link>
              <Link href="/dashboard" className="d-btn d-btn-ghost">
                我的儀表板
              </Link>
            </div>
          </nav>

          {result.kind === "ok" && <ProfileBody data={result.data} />}
          {result.kind === "not_public" && (
            <NotPublic userId={userId} />
          )}
          {result.kind === "unconfigured" && (
            <div className="d-empty">
              公開卡片尚未設定（<code>BOT_API_BASE_URL</code> /{" "}
              <code>PRIMARY_GUILD_ID</code>）。
            </div>
          )}
          {result.kind === "error" && (
            <div className="d-empty d-tx-neg">{result.message}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotPublic({ userId }: { userId: string }) {
  return (
    <div className="d-empty">
      <div style={{ fontSize: 18, marginBottom: 8 }}>🔒 這個玩家還沒開放公開卡片</div>
      <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
        玩家 <span className="mono">{userId}</span> 沒有把 <code>publicProfile</code> 打開。
        <br />
        他們可以用 Discord 的 <code>/個人設定</code> 切換為公開。
      </div>
      <Link
        href="/leaderboard"
        className="d-btn d-btn-discord"
        style={{ marginTop: 14 }}
      >
        看排行榜
      </Link>
    </div>
  );
}

function ProfileBody({ data }: { data: PublicProfile }) {
  const { user, level, coin, mining, titles } = data;
  const voiceHours = Math.floor(level.totalVoiceMinutes / 60);
  const voiceMins = level.totalVoiceMinutes % 60;

  return (
    <>
      <header className="d-page-head">
        <div className="d-page-head-left">
          <span className="d-crumb mono">/ u / {user.userId}</span>
        </div>
      </header>

      <section className="d-profile-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.avatar}
          alt=""
          width={96}
          height={96}
          className="d-profile-avatar"
        />
        <div className="d-profile-meta">
          <h1 className="d-profile-name">{user.displayName}</h1>
          <span className="d-profile-username">@{user.username}</span>
          {titles.equipped && (
            <span className="d-profile-title">🏆 {titles.equipped}</span>
          )}
        </div>
        <div className="d-profile-level">
          <span className="d-c-sub">LEVEL</span>
          <span className="d-num-xxl">{level.level}</span>
          <span className="d-kicker">{fmt(level.totalXp)} XP</span>
        </div>
      </section>

      <div className="d-grid-3">
        <Stat title="累積收入" sub="LIFETIME COIN" value={fmt(coin.lifetime)} unit="幣" />
        <Stat title="連勝" sub="STREAK" value={String(level.streak)} unit="天" />
        <Stat title="最長連勝" sub="LONGEST" value={String(level.longestStreak)} unit="天" />
        <Stat title="累計簽到" sub="CHECK-IN" value={fmt(level.totalCheckins)} unit="天" />
        <Stat title="發言累計" sub="MESSAGES" value={fmt(level.totalMessages)} unit="則" />
        <Stat
          title="語音累計"
          sub="VOICE"
          value={`${fmt(voiceHours)}h ${voiceMins}m`}
        />
      </div>

      <div className="d-section-title">
        <h2>活動紀錄</h2>
        <span className="d-section-en">ACTIVITY</span>
      </div>
      <div className="d-grid-5">
        <MiniStat label="挖礦次數" value={mining.mineCount} />
        <MiniStat label="釣魚次數" value={mining.fishCount} />
        <MiniStat label="打工次數" value={mining.workCount} />
        <MiniStat label="地下城通關" value={mining.dungeonCount} />
        <MiniStat label="合成次數" value={mining.craftCount} />
      </div>

      <div className="d-section-title">
        <h2>挖礦・釣魚收穫</h2>
        <span className="d-section-en">HARVEST</span>
      </div>
      <div className="d-grid-2-eq">
        <HarvestCard
          title="累計挖到"
          sub="LIFETIME ORE"
          entries={Object.entries(ORES).map(([id, info]) => ({
            id,
            emoji: info.emoji,
            name: info.name,
            count: mining.lifetimeOre[id] ?? 0,
          }))}
        />
        <HarvestCard
          title="魚袋（持有中）"
          sub="FISH BAG"
          entries={Object.entries(FISH).map(([id, info]) => ({
            id,
            emoji: info.emoji,
            name: info.name,
            count: mining.fishBag[id] ?? 0,
          }))}
        />
      </div>

      {titles.count > 0 && (
        <>
          <div className="d-section-title">
            <h2>稱號收藏</h2>
            <span className="d-section-en">
              {titles.count} TITLES
            </span>
          </div>
          <div className="d-profile-titles">
            {titles.unlocked.map((t) => (
              <span
                key={t}
                className={
                  "d-pill" +
                  (t === titles.equipped ? " active" : "")
                }
              >
                {t === titles.equipped ? "🏆 " : ""}
                {t}
              </span>
            ))}
          </div>
        </>
      )}

      <p className="d-notice">
        這是 {user.displayName} 在逼逼伺服器的公開卡片。
        想看自己的完整資料請去 <Link href="/dashboard">/dashboard</Link>。
      </p>
    </>
  );
}

function Stat({
  title,
  sub,
  value,
  unit,
}: {
  title: string;
  sub: string;
  value: string;
  unit?: string;
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
        <div className="d-num-xl">{value}</div>
        {unit && <div className="d-kbd">{unit}</div>}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="d-card d-card-small">
      <span className="d-mini-lab">{label}</span>
      <span className="d-num-md">{fmt(value)}</span>
    </div>
  );
}

function HarvestCard({
  title,
  sub,
  entries,
}: {
  title: string;
  sub: string;
  entries: { id: string; emoji: string; name: string; count: number }[];
}) {
  return (
    <div className="d-card">
      <div className="d-c-head">
        <div>
          <div className="d-c-title">{title}</div>
          <div className="d-c-sub">{sub}</div>
        </div>
      </div>
      <div className="d-row-list">
        {entries.map((e) => (
          <div key={e.id} className="d-list-row">
            <span className="d-list-key">
              <span className="d-emoji">{e.emoji}</span>
              {e.name}
            </span>
            <span className="d-list-val">{fmt(e.count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
