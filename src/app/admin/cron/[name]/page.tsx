import Link from "next/link";
import { checkAdmin } from "@/lib/admin/permissions";
import { fetchCronRuns, type CronRunRow } from "@/lib/admin/cron";
import { fmtDateTimeWithSeconds } from "@/lib/format/time";
import { RunButton } from "../RunButton";

export const dynamic = "force-dynamic";

function fmtTime(s: string | undefined | null): string {
  if (!s) return "—";
  return fmtDateTimeWithSeconds(s);
}

function fmtDuration(ms: number | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60_000).toFixed(1)} m`;
}

export default async function CronJobRunsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  const admin = await checkAdmin();
  if (admin.status !== "ok") return null;

  const data = await fetchCronRuns(admin.identity.userId, name, 50);
  const rows = data.rows;

  return (
    <>
      <header className="d-page-head">
        <div className="d-page-head-left">
          <span className="d-crumb">
            <Link href="/admin/cron">/ admin / cron</Link>
            {" / "}
            <span className="mono">{name}</span>
          </span>
        </div>
      </header>

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">最近執行</span>
          <span className="d-greeting-name">{rows.length} 筆</span>
        </div>
        {data.registered && admin.identity.isOwner && (
          <RunButton name={name} />
        )}
      </div>

      {!data.registered && (
        <div className="d-empty">
          <code>{name}</code> 目前未在 registry 註冊（可能已下線）。仍顯示歷史紀錄。
        </div>
      )}

      {rows.length === 0 ? (
        <div className="d-empty">沒有歷史紀錄。</div>
      ) : (
        <div className="d-run-list">
          {rows.map((r) => (
            <RunRow key={String(r._id || r.startedAt)} r={r} />
          ))}
        </div>
      )}

      <p className="d-notice">
        紀錄保留 90 天（CronJobLog TTL）。失敗紀錄會展開 error message 與 stack。
      </p>
    </>
  );
}

function RunRow({ r }: { r: CronRunRow }) {
  const failed = r.status === "failed";
  return (
    <article
      className={"d-card" + (failed ? " d-run-failed" : "")}
      style={{ marginBottom: 8 }}
    >
      <div
        className="d-c-head"
        style={{ alignItems: "center", flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <span
            className={
              "d-pill " +
              (r.status === "success"
                ? "d-tx-pos"
                : r.status === "failed"
                  ? "d-tx-neg"
                  : "")
            }
            style={{ marginRight: 8 }}
          >
            {r.status}
          </span>
          <span className="mono" style={{ fontSize: 12 }}>
            {fmtTime(r.startedAt)} → {fmtTime(r.finishedAt)} ·{" "}
            {fmtDuration(r.durationMs)}
          </span>
        </div>
        {r.trigger && (
          <span className="d-kicker">
            {r.trigger === "manual" ? "手動觸發" : "排程"}
          </span>
        )}
      </div>

      {r.status === "success" && r.result !== undefined && r.result !== null && (
        <pre className="d-pre">{JSON.stringify(r.result, null, 2)}</pre>
      )}

      {r.status === "failed" && (
        <>
          {r.error && (
            <div className="d-tx-neg" style={{ marginTop: 8 }}>
              {r.error}
            </div>
          )}
          {r.stack && (
            <details style={{ marginTop: 8 }}>
              <summary className="d-kicker" style={{ cursor: "pointer" }}>
                stack trace
              </summary>
              <pre className="d-pre">{r.stack}</pre>
            </details>
          )}
        </>
      )}
    </article>
  );
}
