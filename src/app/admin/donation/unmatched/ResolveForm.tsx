"use client";

import { useActionState } from "react";
import { resolveUnmatchedAction, type ResolveState } from "./actions";

const initialState: ResolveState = { status: "idle" };

export function ResolveForm({ id, suggestion }: { id: string; suggestion?: string }) {
  const [state, formAction, pending] = useActionState(
    resolveUnmatchedAction,
    initialState,
  );

  return (
    <form action={formAction} className="d-resolve-form">
      <input type="hidden" name="id" value={id} />
      <div className="d-resolve-row">
        <label className="d-resolve-lab">
          玩家 Discord ID
          <input
            name="userId"
            defaultValue={suggestion ?? ""}
            placeholder="例：123456789012345678"
            className="d-resolve-input mono"
            required
          />
        </label>
        <label className="d-resolve-lab">
          理由（≥ 5 字）
          <input
            name="reason"
            placeholder="例：玩家私訊提供 ID + 付款證明"
            className="d-resolve-input"
            minLength={5}
            required
          />
        </label>
      </div>
      <div className="d-resolve-actions">
        <button
          type="submit"
          className="d-btn d-btn-discord"
          disabled={pending}
        >
          {pending ? "處理中…" : "確認補發"}
        </button>
        {state.status === "success" && (
          <span className="d-resolve-status d-tx-pos">
            ✓ {state.message}
            {state.perks && state.perks.length > 0 ? (
              <> · {state.perks.join("、")}</>
            ) : null}
          </span>
        )}
        {state.status === "error" && (
          <span className="d-resolve-status d-tx-neg">✗ {state.message}</span>
        )}
      </div>
    </form>
  );
}
