import { redirect } from "next/navigation";
import { readSession, avatarUrl, type DiscordSession } from "@/lib/donation/session";
import { DONATION_TIERS } from "@/lib/donation/tiers";
import { DONATION_SKUS } from "@/lib/donation/skus";
import ConfirmForm from "./confirm-form";
import DonateNav from "../_components/donate-nav";

export const dynamic = "force-dynamic";

type SP = Promise<{ sku?: string }>;

export default async function ConfirmPage({ searchParams }: { searchParams: SP }) {
  const session = await readSession();
  if (!session) redirect("/donate");
  const s: DiscordSession = session;
  const { sku } = await searchParams;

  return (
    <>
      <DonateNav active="/donate" />
      <div className="donate-shell">
        <div className="donate-panel">
          <div className="donate-panel-header">
            <h1>確認身份</h1>
            <span className="crumb">/ donate / confirm</span>
          </div>
          <div className="donate-body">
            <div className="identity-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="avatar" src={avatarUrl(s)} alt="" width={44} height={44} />
              <div className="who">
                <span className="greeting">
                  你好，{s.globalName ?? s.username}
                </span>
                <span className="uid">id {s.id}</span>
              </div>
              <form action="/api/auth/discord/logout" method="post" style={{ marginLeft: "auto", marginBottom: 0 }}>
                <button type="submit" className="donate-btn ghost" style={{ padding: "8px 14px", fontSize: 12 }}>
                  不是我
                </button>
              </form>
            </div>

            <ConfirmForm tiers={DONATION_TIERS} skus={DONATION_SKUS} initialSku={sku ?? null} />
          </div>
        </div>
      </div>
    </>
  );
}
