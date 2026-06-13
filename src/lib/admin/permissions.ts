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
 * 用於在一般頁面的 nav 顯示 admin 連結等場景。
 *
 * 直接讀登入時寫進 session 的 isAdmin 旗標，不再每次打 admin API，
 * 避免一般使用者每次開頁都觸發 bot 的 admin 權限檢查與 WARN log。
 * admin 權限有變動時，使用者重新登入（或 cookie 過期重簽）即會更新；
 * 真正的 /admin 存取仍由各頁的 checkAdmin() 即時驗證。
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await readSession();
  return session?.isAdmin === true;
}

/**
 * 在登入當下查一次「這個 userId 是不是 admin」，結果會寫進 session。
 * 任何失敗（API 未設定、403、網路錯誤）都回 false，且不丟例外，
 * 以免拖垮登入流程。
 */
export async function fetchAdminFlag(userId: string): Promise<boolean> {
  if (!adminApiConfigured()) return false;
  try {
    await adminFetch<AdminMeResponse>("/api/v1/admin/me", userId);
    return true;
  } catch {
    return false;
  }
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
