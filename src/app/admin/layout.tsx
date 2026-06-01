import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import "../dashboard/dashboard.css";
import { checkAdmin } from "@/lib/admin/permissions";

export const metadata: Metadata = {
  title: "Admin — 逼逼機器人",
  description: "管理後台：贊助、經濟、Cron 監控",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await checkAdmin();

  if (result.status === "unauthenticated") {
    redirect("/api/auth/discord/login?next=/admin");
  }

  if (result.status === "forbidden") {
    redirect("/dashboard");
  }

  if (result.status === "unconfigured") {
    return (
      <div className="dash-root dark">
        <div className="d-app">
          <div className="d-app-frame">
            <div className="d-empty">
              Admin API 尚未設定（{result.reason}）。
              <br />
              請在伺服器補上 <code>BOT_API_BASE_URL</code> 與{" "}
              <code>DASHBOARD_ADMIN_SECRET</code>。
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { identity } = result;
  const displayName =
    identity.displayName ??
    identity.username ??
    identity.session.globalName ??
    identity.session.username;

  return (
    <div className="dash-root dark">
      <div className="d-app">
        <div className="d-app-frame">
          <nav className="d-topnav">
            <div className="d-brand-row">
              <Link href="/" className="d-logo" aria-label="逼逼機器人 — 回首頁">
                <span className="mark">BB</span>
                <span className="bn">
                  AD<em>MIN</em>
                </span>
              </Link>
              <div className="d-tabs" style={{ marginLeft: 24 }}>
                <Link href="/admin" className="d-tab">總覽</Link>
                <Link href="/admin/donation" className="d-tab">贊助</Link>
                <Link href="/admin/economy" className="d-tab">經濟</Link>
                <Link href="/admin/cron" className="d-tab">Cron</Link>
              </div>
            </div>
            <div className="d-account">
              <span className="d-account-label">
                Admin{identity.isOwner ? " · Owner" : ""}
              </span>
              <span className="d-account-name">{displayName}</span>
              <Link href="/dashboard" className="d-btn d-btn-ghost">
                ← 回 Dashboard
              </Link>
            </div>
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
