import "server-only";
import { readSession, type DiscordSession } from "@/lib/donation/session";
import { adminFetch, AdminApiError, adminApiConfigured } from "./fetcher";

export type AdminIdentity = {
  session: DiscordSession;
  userId: string;
  isOwner: boolean;
  username: string | null;
  displayName: string | null;
};

export type AdminCheckResult =
  | { status: "ok"; identity: AdminIdentity }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unconfigured"; reason: string };

type AdminMeResponse = {
  ok: true;
  userId: string;
  isOwner: boolean;
  username: string | null;
  displayName: string | null;
};

/**
 * 輕量版：只要知道「現在登入的人是不是 admin」就好。
 * 用於在一般頁面的 nav 顯示 admin 連結等場景；失敗 / 不是 admin 都回 false。
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const result = await checkAdmin().catch(() => null);
  return result?.status === "ok";
}

export async function checkAdmin(): Promise<AdminCheckResult> {
  const session = await readSession();
  if (!session) return { status: "unauthenticated" };

  if (!adminApiConfigured()) {
    return {
      status: "unconfigured",
      reason: "BOT_API_BASE_URL / DASHBOARD_ADMIN_SECRET 未設定",
    };
  }

  try {
    const me = await adminFetch<AdminMeResponse>(
      "/api/v1/admin/me",
      session.id,
    );
    return {
      status: "ok",
      identity: {
        session,
        userId: me.userId,
        isOwner: me.isOwner,
        username: me.username,
        displayName: me.displayName,
      },
    };
  } catch (err) {
    if (err instanceof AdminApiError) {
      if (err.status === 401 || err.status === 403) return { status: "forbidden" };
      if (err.status === 503) {
        return { status: "unconfigured", reason: err.message };
      }
    }
    throw err;
  }
}
