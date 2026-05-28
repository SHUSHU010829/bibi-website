"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = "pending" | "completed" | "expired" | "error";

type StatusResponse = {
  status: Status;
  tradeNo?: string;
  amountNtd?: number;
  tierId?: string;
  perks?: string[];
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15;

export default function SuccessPoller({ sessionId, stub }: { sessionId: string; stub: boolean }) {
  const [state, setState] = useState<StatusResponse>({ status: "pending" });
  const [attempts, setAttempts] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let count = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (cancelled) return;
      count += 1;
      setAttempts(count);
      try {
        const url = `/api/donation/status/${encodeURIComponent(sessionId)}${stub ? "?stub=1" : ""}`;
        const r = await fetch(url, { cache: "no-store" });
        const data = (await r.json()) as StatusResponse;
        if (cancelled) return;
        setState(data);
        if (data.status === "completed" || data.status === "expired" || data.status === "error") return;
      } catch {
        // 短暫網路錯誤；繼續輪詢
      }
      if (count >= MAX_POLLS) {
        setTimedOut(true);
        return;
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    }
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, stub]);

  if (state.status === "completed") {
    return (
      <div className="status-center">
        <p className="status-headline">收到了，謝謝你 🙏</p>
        <p className="status-sub">
          {typeof state.amountNtd === "number" && <>金額 NT${state.amountNtd}　</>}
          {state.tradeNo && <span className="status-tradeno">trade {state.tradeNo}</span>}
        </p>
        {state.perks && state.perks.length > 0 && (
          <ul className="perks">
            {state.perks.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
        <p className="status-sub" style={{ marginTop: 18 }}>
          機器人會私訊收據與本次解鎖內容。可關閉此頁。
        </p>
        <Link href="/" className="donate-btn ghost">回到首頁</Link>
      </div>
    );
  }

  if (state.status === "expired") {
    return (
      <div className="status-center">
        <p className="status-headline">這筆 session 已過期</p>
        <p className="status-sub">如果你已扣款，bot 會在對帳後補發；也可以聯絡管理員。</p>
        <Link href="/donate" className="donate-btn">重新抖內</Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="status-center">
        <p className="status-headline">查詢失敗</p>
        <p className="status-sub">請稍後再試。session: <code>{sessionId}</code></p>
        <Link href="/donate" className="donate-btn ghost">回到抖內首頁</Link>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="status-center">
        <p className="status-headline">等待付款通知中…</p>
        <p className="status-sub">
          金流平台尚未通知，可能稍後仍會到帳。bot 對帳排程會自動補發。
        </p>
        <p className="status-tradeno">session {sessionId}</p>
      </div>
    );
  }

  return (
    <div className="status-center">
      <div className="spinner" />
      <p className="status-headline">付款處理中…</p>
      <p className="status-sub">輪詢付款結果（{attempts}/{MAX_POLLS}）</p>
      <p className="status-tradeno">session {sessionId}</p>
    </div>
  );
}
