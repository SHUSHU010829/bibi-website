"use client";

import { useMemo, useState } from "react";
import type { DonationTier } from "@/lib/donation/tiers";

type Platform = "ecpay" | "opay";

export default function ConfirmForm({ tiers }: { tiers: DonationTier[] }) {
  const [tierId, setTierId] = useState<string>(tiers[1].id);
  const [amount, setAmount] = useState<number>(tiers[1].defaultAmount);
  const [platform, setPlatform] = useState<Platform>("ecpay");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === tierId) ?? tiers[0],
    [tiers, tierId],
  );

  function pickTier(id: string) {
    const t = tiers.find((x) => x.id === id);
    if (!t) return;
    setTierId(id);
    setAmount(t.defaultAmount);
  }

  function changeAmount(v: string) {
    const n = Math.max(0, Math.floor(Number(v) || 0));
    setAmount(n);
    const hit = tiers.find(
      (t) => n >= t.amountMin && (t.amountMax === null || n <= t.amountMax),
    );
    if (hit) setTierId(hit.id);
  }

  async function submit() {
    if (amount < 50) {
      setError("最低贊助金額為 NT$50");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/donation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountNtd: amount, platform }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      if (data.stub) {
        window.location.href = `/donate/success?sessionId=${encodeURIComponent(data.sessionId)}&stub=1`;
        return;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.paymentUrl;
      for (const [k, v] of Object.entries(data.paymentParams as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="section-label">贊助方案</div>
      <div className="tier-pill-row">
        {tiers.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tier-pill"
            data-active={t.id === tierId}
            onClick={() => pickTier(t.id)}
          >
            <span>{t.emoji}</span>
            {t.name}
          </button>
        ))}
      </div>

      <div className="section-label">金額（{selectedTier.amountLabel}）</div>
      <div className="amount-input">
        <span>NT$</span>
        <input
          type="number"
          inputMode="numeric"
          min={50}
          value={amount}
          onChange={(e) => changeAmount(e.target.value)}
        />
      </div>

      <div className="section-label">付款平台</div>
      <div className="platform-row">
        <button
          type="button"
          className="platform-card"
          data-active={platform === "ecpay"}
          onClick={() => setPlatform("ecpay")}
        >
          <span className="ptitle">綠界 ECPay</span>
          <span className="pmeta">信用卡 · 一次性付款</span>
        </button>
        <button
          type="button"
          className="platform-card"
          data-active={platform === "opay"}
          onClick={() => setPlatform("opay")}
        >
          <span className="ptitle">歐付寶 O&apos;Pay</span>
          <span className="pmeta">信用卡 · 一次性付款</span>
        </button>
      </div>

      <p className="notice">
        將收取的回饋方案：<strong>{selectedTier.emoji} {selectedTier.name}</strong>。
        實際發放方案以後端依金額判定為準（權威定義在 bot 的 <code>donation_tiers.json</code>）。
      </p>

      {error && (
        <p style={{ color: "#ff8080", fontSize: 13, marginTop: 12 }}>
          {error}
        </p>
      )}

      <div className="action-row">
        <button
          type="button"
          className="donate-btn"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? "建立付款中…" : `前往付款 NT$${amount}`}
        </button>
      </div>
    </>
  );
}
