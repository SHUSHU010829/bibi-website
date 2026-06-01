import "server-only";
import { getPrimaryGuildId } from "@/lib/dashboard/profile";

export type LeaderboardRow = {
  userId: string;
  displayName: string | null;
  username?: string | null;
  avatar: string | null;
  anonymous?: boolean;
};

export type MiningCountRow = LeaderboardRow & { total: number; count: number };
export type MiningValueRow = LeaderboardRow & { value: number; count: number };
export type MiningDiamondRow = LeaderboardRow & { diamonds: number };
export type TitleRow = LeaderboardRow & { titleCount: number };

export type MiningType = "count" | "value" | "diamond";
export type Period = "today" | "week" | "month" | "all";

export type MiningResponse = {
  ok: true;
  type: MiningType;
  period: Period;
  rows: (MiningCountRow | MiningValueRow | MiningDiamondRow)[];
};

export type TitleResponse = { ok: true; rows: TitleRow[] };

export type WeeklySummaryResponse = {
  ok: true;
  mining: MiningCountRow[];
  value: MiningValueRow[];
  titles: TitleRow[];
  resetEpoch: number;
};

export type LeaderboardError =
  | { status: "ok" }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

function getBotBase(): string | null {
  return process.env.BOT_API_BASE_URL || null;
}

function leaderboardConfigured(): boolean {
  return Boolean(getBotBase() && getPrimaryGuildId());
}

async function fetchLeaderboard<T>(
  path: string,
  query: Record<string, string | number>,
): Promise<T | { unconfigured: true } | { error: string }> {
  const botBase = getBotBase();
  const guildId = getPrimaryGuildId();
  if (!botBase || !guildId) return { unconfigured: true };

  const url = new URL(path, botBase);
  url.searchParams.set("guildId", guildId);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, String(v));
  }
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) {
    return { error: `bot ${resp.status}` };
  }
  return resp.json();
}

export async function fetchMiningLeaderboard(
  type: MiningType,
  period: Period,
  limit = 20,
): Promise<MiningResponse | { unconfigured: true } | { error: string }> {
  return fetchLeaderboard<MiningResponse>("/api/v1/leaderboard/mining", {
    type,
    period,
    limit,
  });
}

export async function fetchTitleLeaderboard(
  limit = 20,
): Promise<TitleResponse | { unconfigured: true } | { error: string }> {
  return fetchLeaderboard<TitleResponse>("/api/v1/leaderboard/titles", {
    limit,
  });
}

export async function fetchWeeklySummary(
  top = 3,
): Promise<WeeklySummaryResponse | { unconfigured: true } | { error: string }> {
  return fetchLeaderboard<WeeklySummaryResponse>(
    "/api/v1/leaderboard/weekly-summary",
    { top },
  );
}

export { leaderboardConfigured };
