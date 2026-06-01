/**
 * Server-side fetcher for bot admin API.
 *
 * 認證模式（與 donation API 一致）：
 *   - Authorization: Bearer ${DASHBOARD_ADMIN_SECRET}（server-to-server）
 *   - 帶上 X-Admin-User-Id（從 Discord session 拿）
 *   - bot 端 requireAdmin middleware 會驗 secret + 查 ManageGuild
 */

export type AdminFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  cache?: RequestCache;
};

export class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

function getBotBase(): string | null {
  return process.env.BOT_API_BASE_URL || null;
}

function getAdminSecret(): string | null {
  return process.env.DASHBOARD_ADMIN_SECRET || null;
}

export function adminApiConfigured(): boolean {
  return Boolean(getBotBase() && getAdminSecret());
}

export async function adminFetch<T = unknown>(
  path: string,
  userId: string,
  opts: AdminFetchOptions = {},
): Promise<T> {
  const botBase = getBotBase();
  const secret = getAdminSecret();
  if (!botBase || !secret) {
    throw new AdminApiError(
      "BOT_API_BASE_URL / DASHBOARD_ADMIN_SECRET 未設定",
      503,
    );
  }

  const url = new URL(path, botBase);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secret}`,
    "X-Admin-User-Id": userId,
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const resp = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache ?? "no-store",
  });

  let payload: unknown = null;
  const text = await resp.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!resp.ok) {
    const msg =
      (payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? `admin API ${resp.status}`;
    throw new AdminApiError(msg, resp.status, payload);
  }

  return payload as T;
}
