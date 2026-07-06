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
  recentTx: {
    createdAt: string;
    source: string;
    sourceLabel?: string;
    amount: number;
  }[];
};

export type EconomySnapshotPoint = {
  date: string;
  totalCirculation: number;
  totalWalletCoins: number;
  totalDepositPrincipal: number;
  activeUsers: number;
  flow: {
    mintedTotal: number;
    burnedTotal: number;
    netFlow: number;
  } | null;
  concentration: {
    top10Coins: number;
    top10Share: number;
  } | null;
};

export type EconomyOverview = {
  ok: true;
  guildId: string;
  range: { days: number; fromIso: string; toIso: string };
  circulation: {
    totalWalletCoins: number;
    totalDepositPrincipal: number;
    totalCirculation: number;
    activeUsers: number;
    userCount: number;
    activeDepositCount: number;
  };
  totals: {
    mintedTotal: number;
    burnedTotal: number;
    netFlow: number;
  };
  topHolders: { top10Coins: number; top10Share: number };
  snapshots: EconomySnapshotPoint[];
};

// 經濟健康度趨勢：讀 EconomySnapshots（每日凍結、永久保留），
// 而非即時 CoinTransactions（30 天 TTL），長天期才不會後段歸零。
export async function fetchEconomyOverview(
  adminUserId: string,
  days: number,
): Promise<EconomyOverview> {
  return adminFetch<EconomyOverview>(
    "/api/v1/admin/economy/overview",
    adminUserId,
    { query: { days } },
  );
}

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
  txLimit = 50,
): Promise<UserSummary> {
  return adminFetch<UserSummary>(
    `/api/v1/admin/users/${targetUserId}`,
    adminUserId,
    { query: { tx: txLimit } },
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
