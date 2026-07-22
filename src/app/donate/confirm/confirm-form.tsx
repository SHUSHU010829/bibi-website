"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { coinsForAmount, type DonationTier } from "@/lib/donation/tiers";
import { type DonationSku } from "@/lib/donation/skus";

type Platform = "ecpay" | "opay";

type CreatedSession = {
  sessionId: string;
  code: string;
  paymentUrl: string;
  stub?: boolean;
};

export default function ConfirmForm({
  tiers,
  skus,
  initialSku,
}: {
  tiers: DonationTier[];
  skus: DonationSku[];
  initialSku?: string | null;
}) {
  const router = useRouter();
  const [tierId, setTierId] = useState<string>(tiers[1].id);
  const [amount, setAmount] = useState<number>(tiers[1].defaultAmount);
  const [platform, setPlatform] = useState<Platform>("ecpay");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [skuId, setSkuId] = useState<string | null>(
    initialSku && skus.some((s) => s.id === initialSku) ? initialSku : null,
  );

  const activeSku = useMemo(
    () => skus.find((s) => s.id === skuId) ?? null,
    [skus, skuId],
  );

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === tierId) ?? tiers[0],
    [tiers, tierId],
  );

  const previewCoins = useMemo(() => coinsForAmount(amount), [amount]);
  const effectiveAmount = activeSku ? activeSku.amount : amount;

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
    if (!activeSku && amount < 50) {
      setError("最低贊助金額為 NT$50（未滿不發放方案回饋）");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/donation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          activeSku ? { sku: activeSku.id, platform } : { amountNtd: amount, platform },
        ),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      setCreated({
        sessionId: data.sessionId,
        code: data.code,
        paymentUrl: data.paymentUrl,
        stub: data.stub,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCode() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // 不支援 clipboard API → 忽略，使用者可手動選取
    }
  }

  function goToPayment() {
    if (!created) return;
    // 開新分頁去付款
    window.open(created.paymentUrl, "_blank", "noopener,noreferrer");
    // 本分頁推進 success page（持續輪詢 + 顯示 code 提醒）
    const suffix = created.stub ? "&stub=1" : "";
    router.push(
      `/donate/success?sessionId=${encodeURIComponent(created.sessionId)}&code=${encodeURIComponent(created.code)}${suffix}`,
    );
  }

  // ── Stage 2: 顯示 code + 開付款頁 ───────────────────────────────────────
  if (created) {
    const platformName = platform === "ecpay" ? "綠界" : "歐付寶";
    return (
      <>
        <div className="section-label">本次{activeSku ? "購買" : "贊助"}內容</div>
        <div className="order-summary">
          <div className="order-row">
            <span className="order-key">{activeSku ? "商品" : "方案"}</span>
            <span className="order-val">
              {activeSku ? (
                <>
                  {activeSku.emoji} {activeSku.name}
                </>
              ) : (
                <>
                  {selectedTier.emoji} {selectedTier.name}
                </>
              )}
            </span>
          </div>
          <div className="order-row">
            <span className="order-key">金額</span>
            <span className="order-val">NT${effectiveAmount.toLocaleString()}</span>
          </div>
          <div className="order-row">
            <span className="order-key">{activeSku ? "獲得" : "可獲得金幣"}</span>
            <span className="order-val accent">
              {activeSku
                ? `連續通行證 × ${activeSku.qty}`
                : `${previewCoins.toLocaleString()} 金幣`}
            </span>
          </div>
          <div className="order-row">
            <span className="order-key">付款平台</span>
            <span className="order-val">{platformName}</span>
          </div>
        </div>

        <div className="section-label">付款代碼</div>
        <div className="code-card">
          <span className="code-label">請複製此代碼，並在{platformName}的「贊助者留言」欄輸入</span>
          <div className="code-value-row">
            <span className="code-value">{created.code}</span>
            <button type="button" className="donate-btn ghost" onClick={copyCode}>
              {copied ? "已複製 ✓" : "複製"}
            </button>
          </div>
        </div>

        <ol className="steps">
          <li>點下方「開啟付款頁」會在新分頁開啟{platformName}收款頁</li>
          <li>填寫贊助者名稱、金額 NT${effectiveAmount}、付款方式</li>
          <li>
            <strong>務必在「贊助者留言」欄輸入</strong>：
            <code className="inline-code">{created.code}</code>
          </li>
          <li>完成付款後可關閉付款分頁，本頁會自動偵測結果</li>
        </ol>

        {activeSku && (
          <p className="notice">
            ⚠️ 請務必付款 <strong>NT${effectiveAmount}</strong>（此為商品固定價格）。
            若實付低於此金額，系統將不會發放此商品。
          </p>
        )}

        <p className="notice bot-notice">
          💬 付款完成後，你會在 Discord 收到 <strong>BOT 的發放通知</strong>。
          若遲遲沒有收到通知，請聯繫 <strong>SHUSHU</strong> 協助處理。
        </p>

        <p className="notice">
          代碼 30 分鐘內有效。若不慎打錯或忘記輸入，可請管理員人工補發。
          {created.stub && (
            <>
              <br />
              <strong>※ stub 模式</strong>：bot 端 API 尚未上線，付款不會真的發放回饋，
              此次僅供 UI 流程測試。
            </>
          )}
        </p>

        <div className="action-row">
          <button
            type="button"
            className="donate-btn ghost"
            onClick={() => setCreated(null)}
          >
            ← 重選
          </button>
          <button type="button" className="donate-btn" onClick={goToPayment}>
            開啟{platformName}付款頁 →
          </button>
        </div>
      </>
    );
  }

  // ── Stage 1（商品 SKU 模式）：選通行證組合 + 平台 ──────────────────────
  if (activeSku) {
    return (
      <>
        <div className="section-label">連續通行證</div>
        <div className="tier-pill-row">
          {skus.map((s) => (
            <button
              key={s.id}
              type="button"
              className="tier-pill"
              data-active={s.id === skuId}
              onClick={() => setSkuId(s.id)}
            >
              <span>{s.emoji}</span>
              {s.name}
            </button>
          ))}
        </div>

        <div className="order-summary" style={{ marginTop: 12 }}>
          <div className="order-row">
            <span className="order-key">商品</span>
            <span className="order-val">
              {activeSku.emoji} {activeSku.name}
            </span>
          </div>
          <div className="order-row">
            <span className="order-key">價格</span>
            <span className="order-val accent">NT${activeSku.amount.toLocaleString()}</span>
          </div>
        </div>
        <p className="coin-preview">
          啟用後 1 小時內無視等級即可連續挖礦與連續釣魚（仍照冷卻扣 CD 縮短券）。
        </p>

        <div className="section-label">付款平台</div>
        <div className="platform-row">
          <button
            type="button"
            className="platform-card"
            data-active={platform === "ecpay"}
            onClick={() => setPlatform("ecpay")}
          >
            <span className="ptitle">綠界 ECPay</span>
            <span className="pmeta">信用卡 / ATM / 超商</span>
          </button>
          <button
            type="button"
            className="platform-card"
            data-active={platform === "opay"}
            onClick={() => setPlatform("opay")}
          >
            <span className="ptitle">歐付寶 O&apos;Pay</span>
            <span className="pmeta">信用卡 / ATM / TWQR</span>
          </button>
        </div>

        <p className="notice">
          此為獨立商品，只發放 <strong>連續通行證</strong>，不含金幣 / 身分組等贊助方案回饋。
          發放以 bot 依實付金額判定為準。
        </p>

        {error && (
          <p style={{ color: "#ff8080", fontSize: 13, marginTop: 12 }}>{error}</p>
        )}

        <div className="action-row">
          <button type="button" className="donate-btn ghost" onClick={() => setSkuId(null)}>
            ← 改為一般贊助
          </button>
          <button type="button" className="donate-btn" onClick={submit} disabled={submitting}>
            {submitting ? "建立中…" : `取得付款代碼 NT$${activeSku.amount}`}
          </button>
        </div>
      </>
    );
  }

  // ── Stage 1（一般贊助）：選方案 / 金額 / 平台 ──────────────────────────
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
      <p className="coin-preview" aria-live="polite">
        {previewCoins > 0 ? (
          <>→ 可獲得 <strong>{previewCoins.toLocaleString()}</strong> 金幣（付越多領越多）</>
        ) : (
          <>最低贊助金額 NT$50</>
        )}
      </p>

      <div className="section-label">付款平台</div>
      <div className="platform-row">
        <button
          type="button"
          className="platform-card"
          data-active={platform === "ecpay"}
          onClick={() => setPlatform("ecpay")}
        >
          <span className="ptitle">綠界 ECPay</span>
          <span className="pmeta">信用卡 / ATM / 超商</span>
        </button>
        <button
          type="button"
          className="platform-card"
          data-active={platform === "opay"}
          onClick={() => setPlatform("opay")}
        >
          <span className="ptitle">歐付寶 O&apos;Pay</span>
          <span className="pmeta">信用卡 / ATM / TWQR</span>
        </button>
      </div>

      {skus.length > 0 && (
        <p className="coin-preview">
          想快速連續挖礦 / 釣魚？{" "}
          <button
            type="button"
            onClick={() => setSkuId(skus[0].id)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "inherit",
              textDecoration: "underline",
              font: "inherit",
            }}
          >
            改買連續通行證 🎟️
          </button>
        </p>
      )}

      <p className="notice">
        將收取的回饋方案：<strong>{selectedTier.emoji} {selectedTier.name}</strong>。
        實際發放方案以後端依金額判定為準（權威定義在 bot 的 <code>donation.json</code>）。
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
          {submitting ? "建立中…" : `取得付款代碼 NT$${amount}`}
        </button>
      </div>
    </>
  );
}
