import type { Metadata } from "next";
import Link from "next/link";
import "../dashboard/dashboard.css";
import "./stocks.css";

export const metadata: Metadata = {
  title: "股市 — 逼逼機器人",
  description: "即時查看逼逼股市行情、走勢與成交量。",
};

export default function StocksLayout({
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
                  STOCK<em>MARKET</em>
                </span>
              </Link>
            </div>
            <div className="d-account">
              <Link href="/leaderboard/mining" className="d-btn d-btn-ghost">
                排行榜
              </Link>
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
