import Link from "next/link";

const NAV_LINKS = [
  { label: "文件", href: "/docs" },
  { label: "抖內", href: "/donate" },
  { label: "儀表板", href: "/dashboard" },
];

const FEATURES = [
  { name: "挖礦", desc: "工具升級、區段風險、運氣加成", href: "/docs/mining" },
  { name: "賭場", desc: "21 點、輪盤、骰寶、老虎機", href: "/docs/casino" },
  { name: "樂透", desc: "每日開獎、累積彩金、分潤", href: "/docs/lottery" },
  { name: "股市", desc: "模擬持股、走勢、財報事件", href: "/docs/stocks" },
  { name: "經濟", desc: "金幣、商店、交易、每日簽到", href: "/docs/economy" },
  { name: "等級", desc: "聊天升級、稱號、季賽排名", href: "/docs/leveling" },
];

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-shell)",
        color: "var(--color-primary)",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          paddingInline: 20,
          borderBottom: "1px solid var(--color-hairline)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontStyle: "italic",
            fontSize: 19,
            color: "var(--color-primary)",
            letterSpacing: "-0.01em",
            marginRight: 44,
            textDecoration: "none",
          }}
        >
          BB
        </Link>

        <div style={{ display: "flex", gap: 24, flex: 1 }}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: 13,
                color: "var(--color-secondary)",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Panel */}
      <div
        style={{
          flex: 1,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: "var(--color-panel)",
            borderRadius: 28,
            border: "1px solid var(--color-hairline)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Hero */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "80px 28px 60px",
              gap: 22,
              borderBottom: "1px solid var(--color-hairline)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 11,
                letterSpacing: "0.16em",
                color: "var(--color-secondary)",
                textTransform: "uppercase",
              }}
            >
              逼逼機器人 — bibi bot
            </span>

            <h1
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(48px, 8vw, 96px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "var(--color-primary)",
                margin: 0,
                maxWidth: 880,
              }}
            >
              在 Discord 裡<br />
              開一座小宇宙
            </h1>

            <p
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: 16,
                lineHeight: 1.75,
                color: "var(--color-primary)",
                opacity: 0.78,
                maxWidth: 560,
                margin: 0,
              }}
            >
              挖礦、賭場、樂透、股市、抽卡 ── 一支機器人把經濟系統與小遊戲全部串起來。
              專為 SHUSHU 的伺服器設計，每天都有事可做。
            </p>

            <a
              href="https://discord.gg/shushu010829"
              target="_blank"
              rel="noopener noreferrer"
              className="discord-link"
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "clamp(24px, 4.5vw, 52px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
                marginTop: 8,
              }}
            >
              discord.gg/shushu010829
            </a>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: 6,
              }}
            >
              <Link href="/docs" style={pillStyle("primary")}>
                看看文件 →
              </Link>
              <Link href="/donate" style={pillStyle("ghost")}>
                ☕ 抖內支持
              </Link>
              <Link href="/dashboard" style={pillStyle("ghost")}>
                儀表板
              </Link>
            </div>
          </section>

          {/* Features */}
          <section style={{ padding: "48px 28px 24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
              <h2
                style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  fontSize: 26,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                  margin: 0,
                  color: "var(--color-primary)",
                }}
              >
                能玩什麼
              </h2>
              <Link
                href="/docs"
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: "var(--color-secondary)",
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                完整文件 →
              </Link>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {FEATURES.map((f) => (
                <Link
                  key={f.name}
                  href={f.href}
                  style={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-hairline)",
                    borderRadius: 18,
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                      fontSize: 20,
                      letterSpacing: "-0.01em",
                      color: "var(--color-primary)",
                    }}
                  >
                    {f.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: 13,
                      color: "var(--color-secondary)",
                      lineHeight: 1.55,
                    }}
                  >
                    {f.desc}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Support CTA */}
          <section
            style={{
              padding: "32px 28px 64px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "var(--color-card)",
                border: "1px solid var(--color-hairline)",
                borderRadius: 22,
                padding: "28px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 260, flex: 1 }}>
                <span
                  style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontStyle: "italic",
                    fontSize: 22,
                    letterSpacing: "-0.01em",
                    color: "var(--color-primary)",
                  }}
                >
                  喜歡這個機器人？
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: 14,
                    color: "var(--color-secondary)",
                    lineHeight: 1.7,
                  }}
                >
                  抖內換金幣、限定身分組、限定卡面與挖礦運氣加成。
                </span>
              </div>
              <Link href="/donate" style={pillStyle("primary")}>
                前往抖內 →
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer
            style={{
              padding: "20px 28px 28px",
              borderTop: "1px solid var(--color-hairline)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 11,
                letterSpacing: "0.06em",
                color: "var(--color-secondary)",
              }}
            >
              © SHUSHU · bibi bot
            </span>
            <div style={{ display: "flex", gap: 18 }}>
              <Link href="/docs" style={footerLink}>文件</Link>
              <Link href="/donate" style={footerLink}>抖內</Link>
              <Link href="/dashboard" style={footerLink}>儀表板</Link>
              <a
                href="https://discord.gg/shushu010829"
                target="_blank"
                rel="noopener noreferrer"
                style={footerLink}
              >
                Discord
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

const footerLink: React.CSSProperties = {
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  fontSize: 12,
  color: "var(--color-secondary)",
  textDecoration: "none",
};

function pillStyle(kind: "primary" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 18px",
    borderRadius: 12,
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 500,
    textDecoration: "none",
    border: "1px solid var(--color-hairline)",
  };
  if (kind === "primary") {
    return {
      ...base,
      background: "var(--color-feature)",
      color: "var(--color-ink)",
      borderColor: "var(--color-feature)",
    };
  }
  return {
    ...base,
    background: "transparent",
    color: "var(--color-primary)",
  };
}
