import crypto from "node:crypto";
import { cookies } from "next/headers";

export type DiscordSession = {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  iat: number;
};

const COOKIE_NAME = "bb_discord";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const s = process.env.DISCORD_SESSION_SECRET;
  if (!s) throw new Error("DISCORD_SESSION_SECRET not set");
  return s;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

export function signSession(session: DiscordSession): string {
  const payload = b64url(JSON.stringify(session));
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string): DiscordSession | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(fromB64url(payload).toString("utf8")) as DiscordSession;
    if (Date.now() / 1000 - parsed.iat > MAX_AGE_SECONDS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<DiscordSession | null> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function writeSession(session: DiscordSession): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export function avatarUrl(s: DiscordSession, size = 128): string {
  if (s.avatar) {
    const ext = s.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${s.id}/${s.avatar}.${ext}?size=${size}`;
  }
  const idx = Number((BigInt(s.id) >> BigInt(22)) % BigInt(6));
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}
