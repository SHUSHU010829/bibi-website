import Link from "next/link";

const INVITE_URL = "https://discord.gg/shushu010829";

// 與首頁 lp-nav 同步的連結組
const LINKS = [
  { label: "能玩什麼", href: "/#features" },
  { label: "抖內支持", href: "/#donate" },
  { label: "完整文件", href: "/docs" },
  { label: "儀表板", href: "/dashboard" },
];

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.5 5.3A16 16 0 0 0 15.6 4l-.3.5a12 12 0 0 1 3.4 1.4 11 11 0 0 0-9.4 0A12 12 0 0 1 12.7 4.5L12.4 4a16 16 0 0 0-3.9 1.3C5.3 9 4.6 12.6 4.8 16.1A16 16 0 0 0 9.6 18l.6-1a10 10 0 0 1-1.7-.8l.4-.3a8 8 0 0 0 6.9 0l.4.3a10 10 0 0 1-1.7.8l.6 1a16 16 0 0 0 4.8-1.9c.3-4-.8-7.6-3.4-10.8ZM10 13.6c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Zm4.6 0c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Z" />
    </svg>
  );
}

export default function DonateNav({ active }: { active?: string }) {
  return (
    <nav className="donate-nav">
      <div className="donate-nav-inner">
        <Link href="/" className="donate-nav-brand">
          <span className="mark">BB</span>
          <span className="bn">逼逼<em>機器人</em></span>
        </Link>
        <div className="donate-nav-mid">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={active === l.href ? "active" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="donate-nav-right">
          <a
            className="donate-nav-cta"
            href={INVITE_URL}
            target="_blank"
            rel="noreferrer"
          >
            <DiscordMark className="dc" /> 加入 Discord
          </a>
        </div>
      </div>
    </nav>
  );
}
