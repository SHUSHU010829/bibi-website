"use server";

import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/admin/permissions";
import { adjustCoins, addXp } from "@/lib/admin/economy";
import { AdminApiError } from "@/lib/admin/fetcher";

export type AdjustState = {
  status: "idle" | "success" | "error";
  message?: string;
};

async function runAdjust(
  formData: FormData,
  kind: "coin" | "xp",
): Promise<AdjustState> {
  const admin = await checkAdmin();
  if (admin.status !== "ok") return { status: "error", message: "未授權" };

  const targetUserId = String(formData.get("userId") || "").trim();
  const delta = Math.floor(Number(formData.get("delta") || 0));
  const reason = String(formData.get("reason") || "").trim();
  const notify = formData.get("notify") === "on";

  if (!/^\d{15,20}$/.test(targetUserId)) {
    return { status: "error", message: "userId 格式錯誤" };
  }
  if (!Number.isFinite(delta) || delta === 0) {
    return { status: "error", message: "delta 必須是非零整數" };
  }
  if (kind === "xp" && delta < 0) {
    return { status: "error", message: "XP 只支援正向加值" };
  }
  if (reason.length < 5) {
    return { status: "error", message: "理由至少 5 個字" };
  }

  try {
    if (kind === "coin") {
      const r = await adjustCoins(admin.identity.userId, targetUserId, {
        delta,
        reason,
        notify,
      });
      revalidatePath(`/admin/economy`);
      const newBalanceMsg =
        r.newBalance !== null ? `，新餘額 ${r.newBalance.toLocaleString()}` : "";
      return {
        status: "success",
        message: `已調整 ${delta >= 0 ? "+" : ""}${delta.toLocaleString()} 金幣${newBalanceMsg}`,
      };
    }
    await addXp(admin.identity.userId, targetUserId, { delta, reason, notify });
    revalidatePath(`/admin/economy`);
    return {
      status: "success",
      message: `已加 ${delta.toLocaleString()} XP`,
    };
  } catch (err) {
    if (err instanceof AdminApiError) {
      return { status: "error", message: `bot ${err.status}：${err.message}` };
    }
    return { status: "error", message: String(err) };
  }
}

export async function adjustCoinsAction(
  _prev: AdjustState,
  formData: FormData,
): Promise<AdjustState> {
  return runAdjust(formData, "coin");
}

export async function addXpAction(
  _prev: AdjustState,
  formData: FormData,
): Promise<AdjustState> {
  return runAdjust(formData, "xp");
}
