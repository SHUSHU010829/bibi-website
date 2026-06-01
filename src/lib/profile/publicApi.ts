import "server-only";
import { getPrimaryGuildId } from "@/lib/dashboard/profile";

export type PublicProfile = {
  ok: true;
  user: {
    userId: string;
    username: string;
    globalName: string | null;
    displayName: string;
    avatar: string;
    bannerColor: number | null;
    joinedAt: string | null;
  };
  level: {
    level: number;
    totalXp: number;
    streak: number;
    longestStreak: number;
    totalCheckins: number;
    totalMessages: number;
    totalVoiceMinutes: number;
  };
  coin: { lifetime: number };
  mining: {
    mineCount: number;
    fishCount: number;
    workCount: number;
    dungeonCount: number;
    craftCount: number;
    lifetimeOre: Record<string, number>;
    fishBag: Record<string, number>;
  };
  titles: {
    equipped: string | null;
    unlocked: string[];
    count: number;
  };
};

export type PublicProfileResult =
  | { kind: "ok"; data: PublicProfile }
  | { kind: "not_found" }
  | { kind: "not_public" }
  | { kind: "unconfigured" }
  | { kind: "error"; message: string };

export async function fetchPublicProfile(
  userId: string,
): Promise<PublicProfileResult> {
  const botBase = process.env.BOT_API_BASE_URL;
  const guildId = getPrimaryGuildId();
  if (!botBase || !guildId) return { kind: "unconfigured" };
  if (!/^\d{15,20}$/.test(userId)) return { kind: "not_found" };

  const url = new URL(`/api/v1/u/${userId}`, botBase);
  url.searchParams.set("guildId", guildId);

  let resp: Response;
  try {
    resp = await fetch(url, { cache: "no-store" });
  } catch (err) {
    return { kind: "error", message: String((err as Error).message) };
  }

  if (resp.status === 404) {
    const body = await resp.json().catch(() => null);
    if (body?.error === "not_public") return { kind: "not_public" };
    return { kind: "not_found" };
  }
  if (!resp.ok) {
    return { kind: "error", message: `bot ${resp.status}` };
  }
  const data = (await resp.json()) as PublicProfile;
  return { kind: "ok", data };
}
