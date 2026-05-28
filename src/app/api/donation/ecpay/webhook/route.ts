import { handleBroadcasterWebhook } from "@/lib/donation/webhookHandler";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  return handleBroadcasterWebhook(req, "ecpay");
}
