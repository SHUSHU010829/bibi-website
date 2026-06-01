import Link from "next/link";

export default function AdminHomePage() {
  return (
    <>
      <header className="d-page-head">
        <div className="d-page-head-left">
          <span className="d-crumb">/ admin</span>
        </div>
      </header>

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">後台</span>
          <span className="d-greeting-name">總覽</span>
        </div>
      </div>

      <div className="d-grid-3">
        <AdminCard
          href="/admin/donation"
          title="贊助管理"
          desc="records / unmatched / patrons / stats"
          status="待開發"
        />
        <AdminCard
          href="/admin/economy"
          title="經濟管理"
          desc="調整使用者 coin / 等級，寫稽核"
          status="待開發"
        />
        <AdminCard
          href="/admin/cron"
          title="Cron 監控"
          desc="所有排程任務狀態、手動觸發"
          status="待開發"
        />
      </div>

      <p className="d-notice">
        所有寫入操作都會留稽核紀錄，保留 90 天。
      </p>
    </>
  );
}

function AdminCard({
  href,
  title,
  desc,
  status,
}: {
  href: string;
  title: string;
  desc: string;
  status: string;
}) {
  return (
    <Link href={href} className="d-card d-card-feature">
      <div className="d-c-head">
        <div>
          <div className="d-c-title">{title}</div>
          <div className="d-c-sub">{status}</div>
        </div>
      </div>
      <div className="d-card-body">
        <div className="d-feature-meta">{desc}</div>
      </div>
    </Link>
  );
}
