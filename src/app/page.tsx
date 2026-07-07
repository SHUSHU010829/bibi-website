import Link from "next/link";
import "./landing.css";
import FeatureScroll from "./_components/feature-scroll";

const INVITE = "discord.gg/shushu010829";
const INVITE_URL = "https://discord.gg/shushu010829";

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.5 5.3A16 16 0 0 0 15.6 4l-.3.5a12 12 0 0 1 3.4 1.4 11 11 0 0 0-9.4 0A12 12 0 0 1 12.7 4.5L12.4 4a16 16 0 0 0-3.9 1.3C5.3 9 4.6 12.6 4.8 16.1A16 16 0 0 0 9.6 18l.6-1a10 10 0 0 1-1.7-.8l.4-.3a8 8 0 0 0 6.9 0l.4.3a10 10 0 0 1-1.7.8l.6 1a16 16 0 0 0 4.8-1.9c.3-4-.8-7.6-3.4-10.8ZM10 13.6c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Zm4.6 0c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Z" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="lp" data-motion="on" id="top">
      {/* =================== NAV =================== */}
      <nav className="lp-nav">
        <div className="wrap">
          <Link className="brand" href="#top">
            <span className="mark">BB</span>
            <span className="bn">逼逼<em>機器人</em></span>
          </Link>
          <div className="nav-mid">
            <a href="#features">能玩什麼</a>
            <a href="#donate">抖內支持</a>
            <a href="/stocks" target="_blank" rel="noreferrer">
              股市 <span className="arr" aria-hidden>↗</span>
            </a>
            <a href="/docs" target="_blank" rel="noreferrer">
              查看文件 <span className="arr" aria-hidden>↗</span>
            </a>
            <a href="/dashboard" target="_blank" rel="noreferrer">
              DashBoard <span className="arr" aria-hidden>↗</span>
            </a>
          </div>
          <div className="nav-right">
            <a className="btn solid" href={INVITE_URL} target="_blank" rel="noreferrer">
              <DiscordMark className="dc" /> 加入 Discord
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* =================== HERO =================== */}
        <header className="hero wrap">
          <div className="hero-kicker reveal"><span className="blip" /> 逼逼機器人 · BIBIBOT</div>
          <h1 className="hero-title reveal" style={{ animationDelay: ".06s" }}>
            <span className="l intro">在 Discord 裡，</span>
            <span className="l">迎接<span className="uni">戲劇人生</span></span>
          </h1>
          <p className="hero-sub reveal" style={{ animationDelay: ".12s" }}>
            挖礦、賭場、樂透、股市、抽卡——<b>一支機器人</b>把經濟系統和一堆小遊戲全部串起來。
            專為 <b>SHUSHU</b> 的伺服器打造，每天都有事可做（而且，呃，有點難戒）。
          </p>
          <div className="hero-cta reveal" style={{ animationDelay: ".18s" }}>
            <a className="btn solid lg" href={INVITE_URL} target="_blank" rel="noreferrer">
              <DiscordMark className="dc" /> 加入 Discord
            </a>
            <a className="btn lg" href="#features">先看看能玩什麼 →</a>
            <span className="invite-note">邀請碼 <code>{INVITE}</code></span>
          </div>

          <div className="hero-ribbon reveal" style={{ animationDelay: ".24s" }}>
            <div className="stat"><div className="n">6<em>+</em></div><div className="k">內建玩法系統</div></div>
            <div className="stat"><div className="n">24<em>/</em>7</div><div className="k">不睡覺的莊家</div></div>
            <div className="stat"><div className="n">∞</div><div className="k">每日簽到不間斷</div></div>
            <div className="stat"><div className="n">1</div><div className="k">把肝變現的機器人</div></div>
          </div>
        </header>

        {/* =================== FEATURES =================== */}
        <FeatureScroll />

        {/* =================== DONATE =================== */}
        <section className="donate wrap" id="donate">
          <div className="donate-card reveal">
            <div className="deco" />
            <div className="donate-left">
              <div className="k">☕ Support · 抖內</div>
              <h2>喜歡這隻機器人嗎？<br />請它喝杯咖啡吧。</h2>
              <p>
                抖內可以換金幣、限定身分組、限定卡面，還有挖礦運氣加成。
                說穿了就是——你旺它一下，它旺你一整季。
              </p>
              <Link className="btn solid" href="/donate">前往抖內 →</Link>
            </div>
            <div className="donate-perks">
              <div className="perk"><span className="ic">🪙</span> 一包金幣，立刻入帳</div>
              <div className="perk"><span className="ic">🎴</span> 限定卡面，別人抽不到</div>
              <div className="perk"><span className="ic">🎖</span> 專屬身分組，聊天底氣 +10</div>
              <div className="perk"><span className="ic">⛏</span> 挖礦運氣加成，傳說礦更近一步</div>
            </div>
          </div>
        </section>
      </main>

      {/* =================== FOOTER =================== */}
      <footer className="lp-foot">
        <div className="wrap">
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
          <div className="foot-links">
            <a href="/docs" target="_blank" rel="noreferrer">查看文件</a>
            <a href="#donate">抖內</a>
            <a href="/dashboard" target="_blank" rel="noreferrer">DashBoard</a>
            <a href={INVITE_URL} target="_blank" rel="noreferrer">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
