"use server";

import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/admin/permissions";
import { resolveUnmatched } from "@/lib/admin/donation";
import { AdminApiError } from "@/lib/admin/fetcher";

export type ResolveState = {
  status: "idle" | "success" | "error";
  message?: string;
  perks?: string[] | null;
  alreadyGranted?: boolean;
};

export async function resolveUnmatchedAction(
  _prev: ResolveState,
  formData: FormData,
): Promise<ResolveState> {
  const admin = await checkAdmin();
  if (admin.status !== "ok") {
    return { status: "error", message: "未授權" };
  }

  const id = String(formData.get("id") || "");
  const userId = String(formData.get("userId") || "").trim();
  const reason = String(formData.get("reason") || "").trim();

  if (!id) return { status: "error", message: "缺少 id" };
  if (!userId) return { status: "error", message: "請填玩家 Discord ID" };
  if (reason.length < 5) {
    return { status: "error", message: "理由至少 5 個字" };
  }

  try {
    const result = await resolveUnmatched(admin.identity.userId, id, {
      userId,
      reason,
    });
    revalidatePath("/admin/donation/unmatched");
    revalidatePath("/admin/donation");
    return {
      status: "success",
      perks: result.perks,
      alreadyGranted: result.alreadyGranted,
      message: result.alreadyGranted
        ? "標記已處理（這筆 tradeNo 之前已發放過）"
        : "已發放並標記為 resolved",
    };
  } catch (err) {
    if (err instanceof AdminApiError) {
      return { status: "error", message: `bot ${err.status}：${err.message}` };
    }
    return { status: "error", message: String(err) };
  }
}
