"use server";

import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/admin/permissions";
import { runCronNow } from "@/lib/admin/cron";
import { AdminApiError } from "@/lib/admin/fetcher";

export type RunState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function runCronAction(
  _prev: RunState,
  formData: FormData,
): Promise<RunState> {
  const admin = await checkAdmin();
  if (admin.status !== "ok") return { status: "error", message: "未授權" };
  if (!admin.identity.isOwner) {
    return { status: "error", message: "僅 Owner 可手動觸發" };
  }

  const name = String(formData.get("name") || "");
  if (!name) return { status: "error", message: "缺少 name" };

  try {
    const r = await runCronNow(admin.identity.userId, name);
    revalidatePath("/admin/cron");
    revalidatePath(`/admin/cron/${name}`);
    return {
      status: "success",
      message: `已執行 ${name}`
        + (r.result ? `（result: ${JSON.stringify(r.result)}）` : ""),
    };
  } catch (err) {
    if (err instanceof AdminApiError) {
      return { status: "error", message: `bot ${err.status}：${err.message}` };
    }
    return { status: "error", message: String(err) };
  }
}
