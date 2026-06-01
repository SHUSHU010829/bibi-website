"use client";

import { useActionState } from "react";
import { runCronAction, type RunState } from "./actions";

const initialState: RunState = { status: "idle" };

export function RunButton({ name }: { name: string }) {
  const [state, formAction, pending] = useActionState(
    runCronAction,
    initialState,
  );

  return (
    <form action={formAction} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <input type="hidden" name="name" value={name} />
      <button
        type="submit"
        className="d-btn d-btn-ghost"
        disabled={pending}
      >
        {pending ? "執行中…" : "▶ 立即執行"}
      </button>
      {state.status === "success" && (
        <span className="d-tx-pos" style={{ fontSize: 12 }}>✓ {state.message}</span>
      )}
      {state.status === "error" && (
        <span className="d-tx-neg" style={{ fontSize: 12 }}>✗ {state.message}</span>
      )}
    </form>
  );
}
