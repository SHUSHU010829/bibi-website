import crypto from "node:crypto";
import { cookies } from "next/headers";
import { buildAuthorizeUrl, exchangeCode, fetchUser } from "@/lib/donation/discord";
import { clearSession, writeSession } from "@/lib/donation/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "bb_oauth_state";
const STATE_MAX_AGE = 600;

type Ctx = { params: Promise<{ discord: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  const { discord } = await ctx.params;
  const action = discord[0];

  if (action === "login") return handleLogin(req);
  if (action === "callback") return handleCallback(req);
  if (action === "logout") return handleLogout();
  return new Response("Not found", { status: 404 });
}

export async function POST(req: Request, ctx: Ctx) {
  const { discord } = await ctx.params;
  if (discord[0] === "logout") return handleLogout();
  return new Response("Method not allowed", { status: 405 });
}

async function handleLogin(req: Request): Promise<Response> {
  const state = crypto.randomBytes(16).toString("hex");
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/donate/confirm";
  const stateValue = `${state}:${encodeURIComponent(next)}`;

  const c = await cookies();
  c.set(STATE_COOKIE, stateValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STATE_MAX_AGE,
  });

  let authorizeUrl: string;
  try {
    authorizeUrl = buildAuthorizeUrl(state);
  } catch (e) {
    return new Response(
      `Discord OAuth 未設定：${(e as Error).message}\n` +
        "請在 .env.local 設定 DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET / DISCORD_REDIRECT_URI。",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
  return Response.redirect(authorizeUrl, 302);
}

async function handleCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return new Response("missing code or state", { status: 400 });
  }

  const c = await cookies();
  const stored = c.get(STATE_COOKIE)?.value;
  c.delete(STATE_COOKIE);
  if (!stored) return new Response("state cookie missing", { status: 400 });
  const [storedState, encodedNext] = stored.split(":");
  if (storedState !== state) return new Response("state mismatch", { status: 400 });
  const next = encodedNext ? decodeURIComponent(encodedNext) : "/donate/confirm";

  let accessToken: string;
  let user;
  try {
    accessToken = await exchangeCode(code);
    user = await fetchUser(accessToken);
  } catch (e) {
    return new Response(`oauth failed: ${(e as Error).message}`, { status: 502 });
  }

  await writeSession({
    id: user.id,
    username: user.username,
    globalName: user.global_name,
    avatar: user.avatar,
    iat: Math.floor(Date.now() / 1000),
  });

  return Response.redirect(new URL(next, baseUrl()), 302);
}

async function handleLogout(): Promise<Response> {
  await clearSession();
  return Response.redirect(new URL("/donate", baseUrl()), 302);
}

function baseUrl(): string {
  return process.env.DISCORD_REDIRECT_URI
    ? new URL(process.env.DISCORD_REDIRECT_URI).origin
    : "http://localhost:3000";
}
