import Link from "next/link";
import { DONATION_TIERS } from "@/lib/donation/tiers";
import { readSession, avatarUrl } from "@/lib/donation/session";
import DonateNav from "./_components/donate-nav";

export const dynamic = "force-dynamic";

export default async function DonatePage() {
  const session = await readSession();

  return (
    <>
      <DonateNav active="/donate" />
      <div className="donate-shell">
        <div className="donate-panel">
          <div className="donate-panel-header">
            <h1>抖內</h1>
            <span className="crumb">/ donate</span>
          </div>
          <div className="donate-body">
            <p style={{ fontSize: 14, color: "var(--color-primary)", opacity: 0.85, maxWidth: 640, lineHeight: 1.75 }}>
              支持 SHUSHU 與逼逼機器人持續開發。先用 Discord 登入確認身份，付款完成後金幣、身分組與限定外觀會由
              機器人直接發送到你的帳號。
            </p>

            <div className="section-label">贊助方案</div>
            <div className="tier-grid">
              {DONATION_TIERS.map((t) => (
                <div key={t.id} className="tier-card">
                  <div className="head">
                    <span className="name">
                      <span className="emoji">{t.emoji}</span> {t.name}
                    </span>
                    <span className="amount">{t.amountLabel}</span>
                  </div>
                  <ul>
                    {t.perks.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="section-label">開始</div>
            {session ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
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
                    <span className="greeting">你好，{session.globalName ?? session.username}</span>
                    <span className="uid">id {session.id}</span>
                  </div>
                </div>
                <Link href="/donate/confirm" className="donate-btn">
                  前往確認 →
                </Link>
                <form action="/api/auth/discord/logout" method="post" style={{ margin: 0 }}>
                  <button className="donate-btn ghost" type="submit">
                    切換帳號
                  </button>
                </form>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler, not a page */
              <a href="/api/auth/discord/login?next=/donate/confirm" className="donate-btn discord">
                <DiscordLogo /> 使用 Discord 登入
              </a>
            )}

            <p className="notice">
              本站僅取得 Discord <code>identify</code> 權限（你的 ID、使用者名稱與頭像），不會讀取訊息或加入伺服器的資訊。
              付款由綠界 / 歐付寶處理，逼逼機器人本身不接觸信用卡資訊。
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function DiscordLogo() {
  return (
    <svg width="18" height="14" viewBox="0 0 71 55" fill="currentColor" aria-hidden>
      <path d="M60.1 4.9A58.5 58.5 0 0 0 45.6.4a.2.2 0 0 0-.2.1c-.6 1.1-1.3 2.5-1.8 3.6a54 54 0 0 0-16.2 0c-.5-1.2-1.2-2.5-1.8-3.6a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.9 4.9a.2.2 0 0 0-.1.1C1.6 18.7-1 32 .3 45.2c0 .1 0 .2.1.2A58.9 58.9 0 0 0 18 54.4a.2.2 0 0 0 .2-.1l3.7-5.7a.2.2 0 0 0-.1-.3 38.8 38.8 0 0 1-5.5-2.7.2.2 0 0 1 0-.4c.4-.3.7-.5 1.1-.8a.2.2 0 0 1 .2 0 42 42 0 0 0 35.6 0c.1 0 .2 0 .2 0l1.1.9a.2.2 0 0 1 0 .3 36.4 36.4 0 0 1-5.5 2.7.2.2 0 0 0-.1.3l3.8 5.7c0 .1.1.2.2.1a58.7 58.7 0 0 0 17.7-9c0-.1.1-.1.1-.2 1.5-15.3-2.6-28.5-11-40.2a.1.1 0 0 0-.1-.1ZM23.7 37.2c-3.5 0-6.4-3.2-6.4-7.2 0-4 2.8-7.2 6.4-7.2 3.6 0 6.5 3.2 6.4 7.2 0 4-2.8 7.2-6.4 7.2Zm23.7 0c-3.5 0-6.4-3.2-6.4-7.2 0-4 2.8-7.2 6.4-7.2 3.6 0 6.5 3.2 6.4 7.2 0 4-2.8 7.2-6.4 7.2Z" />
    </svg>
  );
}
