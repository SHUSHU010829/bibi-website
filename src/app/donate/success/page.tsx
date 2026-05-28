import Link from "next/link";
import SuccessPoller from "./success-poller";
import DonateNav from "../_components/donate-nav";

export const dynamic = "force-dynamic";

type SP = Promise<{ sessionId?: string; stub?: string }>;

export default async function SuccessPage({ searchParams }: { searchParams: SP }) {
  const { sessionId, stub } = await searchParams;

  return (
    <>
      <DonateNav active="/donate" />
      <div className="donate-shell">
        <div className="donate-panel">
          <div className="donate-panel-header">
            <h1>付款結果</h1>
            <span className="crumb">/ donate / success</span>
          </div>
          <div className="donate-body">
            {sessionId ? (
              <SuccessPoller sessionId={sessionId} stub={stub === "1"} />
            ) : (
              <div className="status-center">
                <p className="status-headline">缺少 sessionId</p>
                <p className="status-sub">請從 <Link href="/donate">抖內首頁</Link> 重新開始。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
