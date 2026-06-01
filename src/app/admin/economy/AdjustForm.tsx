"use client";

import { useActionState } from "react";
import {
  adjustCoinsAction,
  addXpAction,
  type AdjustState,
} from "./actions";

const initialState: AdjustState = { status: "idle" };

export function AdjustForm({
  userId,
  kind,
}: {
  userId: string;
  kind: "coin" | "xp";
}) {
  const action = kind === "coin" ? adjustCoinsAction : addXpAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const label = kind === "coin" ? "金幣" : "經驗值";
  const placeholder =
    kind === "coin" ? "例：+1000 補償 / -500 罰款" : "例：5000";

  return (
    <form action={formAction} className="d-resolve-form">
      <input type="hidden" name="userId" value={userId} />
      <div className="d-resolve-row">
        <label className="d-resolve-lab">
          {label} 變動量（{kind === "coin" ? "正負整數" : "正整數"}）
          <input
            name="delta"
            type="number"
            step="1"
            min={kind === "xp" ? 1 : undefined}
            placeholder={placeholder}
            className="d-resolve-input mono"
            required
          />
        </label>
        <label className="d-resolve-lab">
          理由（≥ 5 字）
          <input
            name="reason"
            placeholder="例：補償活動 bug"
            className="d-resolve-input"
            minLength={5}
            required
          />
        </label>
      </div>
      <div className="d-resolve-actions">
        <label
          className="d-resolve-status"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <input type="checkbox" name="notify" /> 私訊通知玩家
        </label>
        <button
          type="submit"
          className="d-btn d-btn-discord"
          disabled={pending}
        >
          {pending ? "處理中…" : `確認調整 ${label}`}
        </button>
        {state.status === "success" && (
          <span className="d-resolve-status d-tx-pos">✓ {state.message}</span>
        )}
        {state.status === "error" && (
          <span className="d-resolve-status d-tx-neg">✗ {state.message}</span>
        )}
      </div>
    </form>
  );
}
