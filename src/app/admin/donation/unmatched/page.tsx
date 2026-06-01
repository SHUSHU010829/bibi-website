import Link from "next/link";
import { checkAdmin } from "@/lib/admin/permissions";
import { fetchUnmatched } from "@/lib/admin/donation";
import { DonationHead } from "../_components/SubNav";
import { ResolveForm } from "./ResolveForm";

export const dynamic = "force-dynamic";

const PLATFORM_LABEL: Record<string, string> = {
  ecpay: "綠界",
  opay: "歐付寶",
};

function fmt(n: number): string {
  return n.toLocaleString("zh-TW");
}

function fmtTime(s: string): string {
  return new Date(s).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function asStr(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function AdminUnmatchedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = await checkAdmin();
  if (result.status !== "ok") return null;

  const params = await searchParams;
  const statusParam = asStr(params.status);
  const status: "pending" | "resolved" | "all" =
    statusParam === "resolved" || statusParam === "all" ? statusParam : "pending";
  const page = Math.max(0, Number(asStr(params.page) ?? "0") || 0);

  const data = await fetchUnmatched(result.identity.userId, {
    status,
    page,
    pageSize: 20,
  });

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <>
      <DonationHead active="unmatched" />

      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">未對應</span>
          <span className="d-greeting-name">共 {fmt(data.total)} 筆</span>
        </div>
      </div>

      <div className="d-tx-filters">
        <div className="d-tx-filter-group">
          <span className="d-tx-filter-lab">狀態</span>
          <div className="d-pill-row">
            <Link
              href="/admin/donation/unmatched?status=pending"
              className={"d-pill" + (status === "pending" ? " active" : "")}
            >
              待處理
            </Link>
            <Link
              href="/admin/donation/unmatched?status=resolved"
              className={"d-pill" + (status === "resolved" ? " active" : "")}
            >
              已處理
            </Link>
            <Link
              href="/admin/donation/unmatched?status=all"
              className={"d-pill" + (status === "all" ? " active" : "")}
            >
              全部
            </Link>
          </div>
        </div>
      </div>

      {data.rows.length === 0 ? (
        <div className="d-empty">沒有符合條件的紀錄。</div>
      ) : (
        <div className="d-unmatched-list">
          {data.rows.map((u) => (
            <article key={u._id} className="d-card">
              <div className="d-c-head">
                <div>
                  <div className="d-c-title">
                    NT$ {fmt(u.amountNtd)} ·{" "}
                    {PLATFORM_LABEL[u.platform] ?? u.platform}
                  </div>
                  <div className="d-c-sub">
                    {fmtTime(u.createdAt)} · tradeNo{" "}
                    <span className="mono">{u.tradeNo}</span>
                  </div>
                </div>
                {u.resolved ? (
                  <span className="d-pill d-tx-pos">已處理</span>
                ) : (
                  <span className="d-pill d-tx-neg">待處理</span>
                )}
              </div>
              <div className="d-card-body">
                <div className="d-row-list">
                  <Field
                    label="贊助者名稱"
                    value={u.patronName || "—"}
                  />
                  <Field
                    label="贊助者留言"
                    value={u.patronNote || "—"}
                    mono
                  />
                  <Field
                    label="解析到的 code"
                    value={u.codeAttempt || "（沒抽到合法 code）"}
                    mono
                  />
                  {u.resolved && (
                    <>
                      <Field
                        label="處理時間"
                        value={u.resolvedAt ? fmtTime(u.resolvedAt) : "—"}
                      />
                      <Field
                        label="處理 admin"
                        value={u.resolvedBy || "—"}
                        mono
                      />
                      <Field
                        label="補發給"
                        value={u.resolveUserId || "—"}
                        mono
                      />
                      <Field
                        label="理由"
                        value={u.resolveReason || "—"}
                      />
                    </>
                  )}
                </div>
                {!u.resolved && (
                  <ResolveForm id={String(u._id)} />
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-pager">
          {page > 0 ? (
            <Link
              className="d-btn"
              href={`/admin/donation/unmatched?status=${status}&page=${page - 1}`}
            >
              ← 較新
            </Link>
          ) : (
            <span className="d-btn d-btn-disabled">← 較新</span>
          )}
          <span className="d-pager-page">
            第 {page + 1} / {totalPages} 頁
          </span>
          {page + 1 < totalPages ? (
            <Link
              className="d-btn"
              href={`/admin/donation/unmatched?status=${status}&page=${page + 1}`}
            >
              較舊 →
            </Link>
          ) : (
            <span className="d-btn d-btn-disabled">較舊 →</span>
          )}
        </div>
      )}

      <p className="d-notice">
        補發會：寫一筆 donation_records → 呼叫 grantDonationPerks 真實發放 →
        把 unmatched 標記為 resolved。如果該 tradeNo 已有紀錄，只會標記不重複發放。
      </p>
    </>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="d-list-row">
      <span className="d-list-key">{label}</span>
      <span className={"d-list-val" + (mono ? " mono" : "")}>{value}</span>
    </div>
  );
}
