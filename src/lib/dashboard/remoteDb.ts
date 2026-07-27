import "server-only";
import { BSON } from "mongodb";

// Dashboard / 個人資料頁的唯讀資料存取層。
//
// 網站部署在 Vercel，連不到 bot 所在 Vultr 的內網 Mongo，故不直連 DB：這裡提供一個
// 對照 mongodb driver 常用 API（find / findOne / countDocuments / aggregate / distinct）
// 的薄 shim，把查詢以 EJSON POST 到 bot 的 /api/v1/dashboard/query，由 bot 對本機
// Mongo 執行唯讀查詢後回傳。EJSON 保留 Date / 數字型別，故 profile.ts 的彙總邏輯
// 完全不用改。連線 / 設定缺失或 bot 不可用時，讀取降級為空結果（比照原本 getDonationDb
// 連線失敗回 null 的行為，讓頁面顯示「尚無資料」而非爆掉）。

type Doc = Record<string, unknown>;

interface QueryPayload {
  collection: string;
  op: "find" | "findOne" | "countDocuments" | "aggregate" | "distinct";
  filter?: unknown;
  projection?: unknown;
  sort?: unknown;
  skip?: number;
  limit?: number;
  field?: string;
  pipeline?: unknown[];
}

function getBotBase(): string | null {
  return process.env.BOT_API_BASE_URL || null;
}

function getSecret(): string | null {
  return process.env.DASHBOARD_READONLY_SECRET || null;
}

async function runQuery<T>(payload: QueryPayload, fallback: T): Promise<T> {
  const botBase = getBotBase();
  const secret = getSecret();
  if (!botBase || !secret) return fallback;
  try {
    const resp = await fetch(new URL("/api/v1/dashboard/query", botBase), {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/ejson",
        "x-dashboard-secret": secret,
      },
      body: BSON.EJSON.stringify(payload, { relaxed: true }),
    });
    if (!resp.ok) {
      console.error(`[remoteDb] ${payload.collection}.${payload.op} → bot ${resp.status}`);
      return fallback;
    }
    const parsed = BSON.EJSON.parse(await resp.text()) as { ok?: boolean; result?: T };
    if (!parsed?.ok) return fallback;
    return (parsed.result ?? fallback) as T;
  } catch (e) {
    console.error(`[remoteDb] ${payload.collection}.${payload.op} failed:`, e);
    return fallback;
  }
}

interface FindOptions {
  projection?: unknown;
}

class RemoteCursor {
  private _sort?: unknown;
  private _skip?: number;
  private _limit?: number;

  constructor(
    private readonly collection: string,
    private readonly filter: unknown,
    private readonly options: FindOptions,
  ) {}

  sort(sort: unknown): this {
    this._sort = sort;
    return this;
  }

  skip(n: number): this {
    this._skip = n;
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    return this;
  }

  async toArray(): Promise<Doc[]> {
    return runQuery<Doc[]>(
      {
        collection: this.collection,
        op: "find",
        filter: this.filter,
        projection: this.options.projection,
        sort: this._sort,
        skip: this._skip,
        limit: this._limit,
      },
      [],
    );
  }
}

class AggregateCursor {
  constructor(
    private readonly collection: string,
    private readonly pipeline: unknown[],
  ) {}

  async toArray(): Promise<Doc[]> {
    return runQuery<Doc[]>(
      { collection: this.collection, op: "aggregate", pipeline: this.pipeline },
      [],
    );
  }
}

class RemoteCollection {
  constructor(private readonly name: string) {}

  findOne(filter: unknown, options: FindOptions = {}): Promise<Doc | null> {
    return runQuery<Doc | null>(
      {
        collection: this.name,
        op: "findOne",
        filter,
        projection: options.projection,
      },
      null,
    );
  }

  find(filter: unknown, options: FindOptions = {}): RemoteCursor {
    return new RemoteCursor(this.name, filter, options);
  }

  countDocuments(filter: unknown = {}): Promise<number> {
    return runQuery<number>(
      { collection: this.name, op: "countDocuments", filter },
      0,
    );
  }

  aggregate(pipeline: unknown[]): AggregateCursor {
    return new AggregateCursor(this.name, pipeline);
  }

  distinct(field: string, filter: unknown = {}): Promise<unknown[]> {
    return runQuery<unknown[]>(
      { collection: this.name, op: "distinct", field, filter },
      [],
    );
  }
}

export interface RemoteDb {
  collection(name: string): RemoteCollection;
}

export function getRemoteDb(): RemoteDb | null {
  if (!getBotBase() || !getSecret()) return null;
  return {
    collection: (name: string) => new RemoteCollection(name),
  };
}
