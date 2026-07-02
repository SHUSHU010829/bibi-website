import {
  getStockQuotes,
  getStockSeries,
  getPrimaryGuildId,
  stocksConfigured,
} from "@/lib/dashboard/stocks";
import { StockClient } from "./StockClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Unconfigured() {
  return (
    <div className="d-greeting">
      <div className="d-greeting-text">
        <span className="d-greeting-hi">股市</span>
        <p className="d-greeting-sub">
          股市資料尚未設定。請設定 <code>PRIMARY_GUILD_ID</code> 與{" "}
          <code>MONGODB_URI_READONLY</code> 後再試。
        </p>
      </div>
    </div>
  );
}

export default async function StocksPage() {
  if (!stocksConfigured()) {
    return <Unconfigured />;
  }

  const guildId = getPrimaryGuildId()!;
  const quotes = await getStockQuotes(guildId);
  if (quotes.length === 0) {
    return (
      <div className="d-greeting">
        <div className="d-greeting-text">
          <span className="d-greeting-hi">股市</span>
          <p className="d-greeting-sub">目前沒有上市中的股票。</p>
        </div>
      </div>
    );
  }

  const initialSymbol = quotes[0].symbol;
  const initialSeries = await getStockSeries(guildId, initialSymbol, "1d");

  return (
    <StockClient
      initialQuotes={quotes}
      initialSymbol={initialSymbol}
      initialPeriod="1d"
      initialSeries={initialSeries}
    />
  );
}
