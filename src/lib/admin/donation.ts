import "server-only";
import { adminFetch } from "./fetcher";

export type DonationRecord = {
  _id?: string;
  tradeNo: string;
  sessionId: string | null;
  userId: string;
  guildId: string;
  amountNtd: number;
  tierId: string | null;
  platform: "ecpay" | "opay";
  patronName: string;
  patronNote: string;
  perks: string[] | null;
  grantedAt: string;
  resolvedFromUnmatched?: boolean;
  coinsGranted?: boolean;
  roleGranted?: boolean;
  itemsGranted?: boolean;
  buffGranted?: boolean;
  themeGranted?: boolean;
  titleGranted?: boolean;
  announced?: boolean;
  dmSent?: boolean;
};

export type UnmatchedDonation = {
  _id: string;
  tradeNo: string;
  amountNtd: number;
  platform: "ecpay" | "opay";
  patronName: string;
  patronNote: string;
  codeAttempt: string | null;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolveReason?: string;
  resolveUserId?: string;
};

export type Patron = {
  userId: string;
  lifetimeAmount: number;
  donationCount: number;
  lastDonation: string;
  firstDonation: string;
  lastTierId: string | null;
  lastPatronName: string;
};

export type DonationStats = {
  range: string;
  since: string | null;
  totalAmount: number;
  count: number;
  uniquePatrons: number;
  avgAmount: number;
  byPlatform: { platform: string; amount: number; count: number }[];
  byTier: { tierId: string | null; amount: number; count: number }[];
  pendingUnmatched: number;
};

export type RecordsQuery = {
  from?: string;
  to?: string;
  platform?: "ecpay" | "opay";
  granted?: "true" | "false";
  page?: number;
  pageSize?: number;
};

type Paged<T> = {
  ok: true;
  page: number;
  pageSize: number;
  total: number;
  rows: T[];
};

export async function fetchRecords(
  userId: string,
  q: RecordsQuery,
): Promise<Paged<DonationRecord>> {
  return adminFetch<Paged<DonationRecord>>(
    "/api/v1/admin/donation/records",
    userId,
    { query: q },
  );
}

export async function fetchUnmatched(
  userId: string,
  q: { status?: "pending" | "resolved" | "all"; page?: number; pageSize?: number },
): Promise<Paged<UnmatchedDonation>> {
  return adminFetch<Paged<UnmatchedDonation>>(
    "/api/v1/admin/donation/unmatched",
    userId,
    { query: q },
  );
}

export async function fetchPatrons(
  userId: string,
  q: { sort?: "lifetime" | "recent"; page?: number; pageSize?: number },
): Promise<Paged<Patron>> {
  return adminFetch<Paged<Patron>>(
    "/api/v1/admin/donation/patrons",
    userId,
    { query: q },
  );
}

export async function fetchStats(
  userId: string,
  range: "30d" | "90d" | "365d" | "all" = "30d",
): Promise<{ ok: true } & DonationStats> {
  return adminFetch<{ ok: true } & DonationStats>(
    "/api/v1/admin/donation/stats",
    userId,
    { query: { range } },
  );
}

export type ResolveResult = {
  ok: true;
  alreadyGranted: boolean;
  perks: string[] | null;
  grants?: Record<string, boolean>;
};

export async function resolveUnmatched(
  adminUserId: string,
  id: string,
  body: { userId: string; reason: string },
): Promise<ResolveResult> {
  return adminFetch<ResolveResult>(
    `/api/v1/admin/donation/unmatched/${id}/resolve`,
    adminUserId,
    { method: "POST", body },
  );
}
