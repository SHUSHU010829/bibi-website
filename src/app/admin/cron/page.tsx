import Link from "next/link";
import { checkAdmin } from "@/lib/admin/permissions";
import { fetchCronJobs, type CronJob, type CronLastRun } from "@/lib/admin/cron";
import { fmtDateTimeWithSeconds } from "@/lib/format/time";
import { RunButton } from "./RunButton";

export const dynamic = "force-dynamic";

function fmtTime(s: string | null): string {
  if (!s) return "—";
  return fmtDateTimeWithSeconds(s);
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60_000).toFixed(1)} m`;
}

export default async function AdminCronPage() {
  const admin = await checkAdmin();
  if (admin.status !== "ok") return null;

  const data = await fetchCronJobs(admin.identity.userId);
  const jobs = data.jobs;

  const failingJobs = jobs.filter(
    (j) => j.consecutiveErrors > 0 || j.lastRun?.status === "failed",
  );

  return (
    <>
      <header className="d-page-head">
        <div className="d-page-head-left">
          <span className="d-crumb">/ admin / cron</span>
        </div>
      </header>

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">Cron 監控</span>
          <span className="d-greeting-name">
            {jobs.length} 個已註冊任務
            {failingJobs.length > 0 && (
              <span className="d-tx-neg"> · {failingJobs.length} 個異常</span>
            )}
          </span>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="d-empty">
          目前還沒有任何 cron 任務透過 registerCron 註冊。
        </div>
      ) : (
        <div className="d-table-wrap">
          <table className="d-tbl">
            <thead>
              <tr>
                <th>任務</th>
                <th>排程</th>
                <th>上次執行</th>
                <th>狀態</th>
                <th>耗時</th>
                <th>連錯</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <JobRow key={j.name} job={j} isOwner={admin.identity.isOwner} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="d-notice">
        本表只列出已用 <code>registerCron()</code> 註冊的任務。
        舊有 scheduler 仍會跑（不會卡到），但要在這頁看到狀態需逐一改寫。
        手動觸發只有 Owner 可用，且會寫稽核日誌。
      </p>
    </>
  );
}

function JobRow({ job, isOwner }: { job: CronJob; isOwner: boolean }) {
  const last = job.lastRun;
  return (
    <tr>
      <td>
        <Link href={`/admin/cron/${encodeURIComponent(job.name)}`}>
          <span style={{ fontWeight: 600 }}>{job.label}</span>
          <br />
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>
            {job.name}
          </span>
        </Link>
      </td>
      <td className="mono" style={{ fontSize: 12 }}>
        {job.schedule || "—"}
        <br />
        <span style={{ color: "var(--ink-3)" }}>{job.timezone}</span>
      </td>
      <td style={{ fontSize: 12 }}>
        {fmtTime(last?.startedAt ?? null)}
        {last?.trigger === "manual" && (
          <>
            <br />
            <span style={{ color: "var(--ink-3)" }}>（手動）</span>
          </>
        )}
      </td>
      <td>
        <StatusBadge last={last} stopped={job.stopped} />
      </td>
      <td className="mono" style={{ fontSize: 12 }}>
        {fmtDuration(last?.durationMs ?? null)}
      </td>
      <td
        className={
          "mono " + (job.consecutiveErrors > 0 ? "d-tx-neg" : "")
        }
      >
        {job.consecutiveErrors}
      </td>
      <td>
        {isOwner ? <RunButton name={job.name} /> : <span className="d-kicker">—</span>}
      </td>
    </tr>
  );
}

function StatusBadge({
  last,
  stopped,
}: {
  last: CronLastRun | null;
  stopped: boolean;
}) {
  if (stopped) return <span className="d-pill d-tx-neg">已停止</span>;
  if (!last) return <span className="d-pill">尚未執行</span>;
  if (last.status === "success") return <span className="d-pill d-tx-pos">成功</span>;
  if (last.status === "failed") return <span className="d-pill d-tx-neg">失敗</span>;
  return <span className="d-pill">執行中</span>;
}
