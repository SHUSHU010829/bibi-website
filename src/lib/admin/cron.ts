import "server-only";
import { adminFetch } from "./fetcher";

export type CronLastRun = {
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "failed";
  durationMs: number | null;
  trigger: "scheduled" | "manual" | null;
  error: string | null;
};

export type CronJob = {
  name: string;
  label: string;
  schedule: string | null;
  timezone: string;
  consecutiveErrors: number;
  stopped: boolean;
  lastRun: CronLastRun | null;
};

export type CronRunRow = {
  _id?: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "success" | "failed";
  durationMs?: number;
  trigger?: string;
  result?: unknown;
  error?: string;
  stack?: string;
};

export async function fetchCronJobs(
  userId: string,
): Promise<{ ok: true; jobs: CronJob[] }> {
  return adminFetch("/api/v1/admin/cron/jobs", userId);
}

export async function fetchCronRuns(
  userId: string,
  name: string,
  limit = 50,
): Promise<{ ok: true; name: string; registered: boolean; rows: CronRunRow[] }> {
  return adminFetch(`/api/v1/admin/cron/jobs/${name}/runs`, userId, {
    query: { limit },
  });
}

export async function runCronNow(
  userId: string,
  name: string,
): Promise<{ ok: true; result: unknown }> {
  return adminFetch(`/api/v1/admin/cron/jobs/${name}/run`, userId, {
    method: "POST",
    body: {},
  });
}
