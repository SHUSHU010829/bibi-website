// 共用 bot 的 MongoDB Atlas 唯讀連線。
//
// 設計重點：
// - serverless（Vercel function 或 Zeabur 多 worker）每次冷啟動可能 new client
//   一次，所以把 promise 快取在 globalThis 避免每次請求重連把連線池打爆
// - 唯讀身分；網站不寫任何 collection，所有寫入走 bot grant API
// - MONGODB_URI_READONLY 未設定時回 null，呼叫端應該降級為「pending」回應

import { MongoClient, type Db, type Collection } from "mongodb";

const DB_NAME = "MorningBot";

declare global {
  // eslint-disable-next-line no-var
  var _bibiMongoClient: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> | null {
  const uri = process.env.MONGODB_URI_READONLY;
  if (!uri) return null;
  if (!globalThis._bibiMongoClient) {
    globalThis._bibiMongoClient = new MongoClient(uri, {
      // 唯讀連線；超時設短一點避免 status 端點輪詢卡住
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    }).connect();
  }
  return globalThis._bibiMongoClient;
}

export async function getDonationDb(): Promise<Db | null> {
  const p = getClientPromise();
  if (!p) return null;
  try {
    const client = await p;
    return client.db(DB_NAME);
  } catch {
    // 連線失敗（短暫網路問題 / 帳號權限變更等）→ 讓快取重試下次再 new
    globalThis._bibiMongoClient = undefined;
    return null;
  }
}

// ── 與 bot 共用的 schema（website 只讀，這裡只放實際會用到的欄位） ─────

export type SessionStatus = "pending" | "completed" | "expired";

export interface DonationSessionDoc {
  sessionId: string;
  code: string;
  userId: string;
  guildId: string;
  amountNtd: number;
  platform: "ecpay" | "opay";
  status: SessionStatus;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  tradeNo?: string;
}

export interface DonationRecordDoc {
  tradeNo: string;
  sessionId: string;
  userId: string;
  guildId: string;
  amountNtd: number;
  tierId: string | null;
  platform: "ecpay" | "opay";
  perks: string[] | null;
  grantedAt: Date;
}

export async function getDonationSessionsCollection(): Promise<Collection<DonationSessionDoc> | null> {
  const db = await getDonationDb();
  return db ? db.collection<DonationSessionDoc>("DonationSessions") : null;
}

export async function getDonationRecordsCollection(): Promise<Collection<DonationRecordDoc> | null> {
  const db = await getDonationDb();
  return db ? db.collection<DonationRecordDoc>("DonationRecords") : null;
}
