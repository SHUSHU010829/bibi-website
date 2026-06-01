import type { Metadata } from "next";
import Link from "next/link";
import "../dashboard/dashboard.css";

export const metadata: Metadata = {
  title: "排行榜 — 逼逼機器人",
  description: "查看伺服器內挖礦、稱號、週榜排行。",
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dash-root dark">
      <div className="d-app">
        <div className="d-app-frame">
          <nav className="d-topnav">
            <div className="d-brand-row">
              <Link href="/" className="d-logo" aria-label="逼逼機器人 — 回首頁">
                <span className="mark">BB</span>
                <span className="bn">
                  LEADER<em>BOARD</em>
                </span>
              </Link>
            </div>
            <div className="d-account">
              <Link href="/dashboard" className="d-btn d-btn-ghost">
                我的儀表板
              </Link>
            </div>
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
