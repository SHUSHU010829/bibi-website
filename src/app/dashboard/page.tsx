import Link from "next/link";
import Stamp from "@/components/stamp";

const NAV_LINKS = [
  { label: "首頁", href: "/" },
  { label: "文件", href: "/docs" },
  { label: "抖內", href: "/donate" },
  { label: "儀表板", href: "/dashboard" },
];

export default function Dashboard() {
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
                color:
                  link.href === "/dashboard"
                    ? "var(--color-primary)"
                    : "var(--color-secondary)",
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
            overflow: "hidden",
          }}
        >
          {/* Page header */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              padding: "22px 28px 18px",
              borderBottom: "1px solid var(--color-hairline)",
              flexShrink: 0,
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 30,
                fontWeight: 400,
                color: "var(--color-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              儀表板
            </h1>
            <Stamp />
          </div>

          {/* Content — centered */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              padding: 40,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontStyle: "italic",
                fontSize: 22,
                fontWeight: 400,
                color: "var(--color-secondary)",
                letterSpacing: "-0.01em",
              }}
            >
              儀表板設立中
            </p>

            <a
              href="https://discord.gg/shushu010829"
              target="_blank"
              rel="noopener noreferrer"
              className="discord-link"
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "clamp(32px, 5vw, 64px)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              discord.gg/shushu010829
            </a>

            <p
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: 13,
                color: "var(--color-secondary)",
              }}
            >
              加入伺服器先遊玩！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
