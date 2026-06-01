import "server-only";
import { adminFetch } from "./fetcher";

export type SearchedMember = {
  userId: string;
  username: string;
  globalName: string | null;
  displayName: string;
  avatar: string;
  bot: boolean;
};

export type UserSummary = {
  ok: true;
  user: SearchedMember;
  coin: { balance: number; lifetime: number };
  level: { level: number; totalXp: number; streak: number };
  last30Days: { inflow: number; outflow: number; net: number; count: number };
  recentTx: { createdAt: string; source: string; amount: number }[];
};

export async function searchMembers(
  adminUserId: string,
  q: string,
): Promise<{ ok: true; rows: SearchedMember[] }> {
  return adminFetch("/api/v1/admin/users/search", adminUserId, {
    query: { q },
  });
}

export async function fetchUserSummary(
  adminUserId: string,
  targetUserId: string,
): Promise<UserSummary> {
  return adminFetch<UserSummary>(
    `/api/v1/admin/users/${targetUserId}`,
    adminUserId,
  );
}

export async function adjustCoins(
  adminUserId: string,
  targetUserId: string,
  body: { delta: number; reason: string; notify?: boolean },
): Promise<{ ok: true; delta: number; newBalance: number | null }> {
  return adminFetch(`/api/v1/admin/users/${targetUserId}/coins`, adminUserId, {
    method: "POST",
    body,
  });
}

export async function addXp(
  adminUserId: string,
  targetUserId: string,
  body: { delta: number; reason: string; notify?: boolean },
): Promise<{ ok: true; delta: number }> {
  return adminFetch(`/api/v1/admin/users/${targetUserId}/xp`, adminUserId, {
    method: "POST",
    body,
  });
}
