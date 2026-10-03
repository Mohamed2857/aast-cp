import { createHash, randomBytes } from "node:crypto";

const CF_API = "https://codeforces.com/api";
// Codeforces allows about 1 request per 2 seconds, so every call waits in line.
const MIN_GAP_MS = 2100;

let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    try {
      return await task();
    } finally {
      lastRequestAt = Date.now();
    }
  });
  queue = run.catch(() => undefined);
  return run;
}

export interface CfUser {
  handle: string;
  firstName?: string;
  lastName?: string;
  rank?: string;
  rating?: number;
  avatar?: string;
  titlePhoto?: string;
}

/** Returns the user, or null if the handle does not exist. Throws on other API errors. */
export function fetchCfUser(handle: string): Promise<CfUser | null> {
  const url = `${CF_API}/user.info?handles=${encodeURIComponent(handle)}`;
  return enqueue(async () => {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => null);
    if (data?.status === "OK" && Array.isArray(data.result) && data.result[0]) {
      return data.result[0] as CfUser;
    }
    if (data?.status === "FAILED" && /not found/i.test(String(data.comment ?? ""))) {
      return null;
    }
    throw new Error(`Codeforces API error: ${data?.comment ?? res.status}`);
  });
}

/** Codeforces returns protocol-relative urls like //userpic.codeforces.org/... */
export function normalizeAvatar(cf: CfUser): string | null {
  const url = cf.titlePhoto ?? cf.avatar;
  if (!url) return null;
  return url.startsWith("//") ? `https:${url}` : url;
}

// ---------------------------------------------------------------------------
// Authenticated calls (private group contests). Needs CF_API_KEY + CF_API_SECRET
// from the Codeforces account that manages the group.
// ---------------------------------------------------------------------------

export class CfConfigError extends Error {}
export class CfApiError extends Error {}

export interface CfProblem {
  index: string;
  name: string;
}

export interface CfSubmission {
  id: number;
  creationTimeSeconds: number;
  verdict?: string;
  problem: { index: string };
  author: { members: { handle: string }[]; participantType?: string };
}

export interface CfStandingRow {
  rank: number;
  party: { members: { handle: string }[]; participantType: string };
}

const byAscii = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Signs and sends one call. Signature = rand + sha512(rand/method?sortedParams#secret). */
export async function cfAuthCall<T>(
  method: string,
  params: Record<string, string | number | boolean>,
): Promise<T> {
  const key = process.env.CF_API_KEY;
  const secret = process.env.CF_API_SECRET;
  if (!key || !secret) {
    throw new CfConfigError("CF_API_KEY / CF_API_SECRET are not set on the server");
  }

  return enqueue(async () => {
    const all: [string, string][] = Object.entries({
      ...params,
      apiKey: key,
      time: Math.floor(Date.now() / 1000),
    }).map(([k, v]) => [k, String(v)]);
    all.sort(([ka, va], [kb, vb]) => byAscii(ka, kb) || byAscii(va, vb));

    const rand = randomBytes(3).toString("hex"); // 6 characters
    const toSign = `${rand}/${method}?${all.map(([k, v]) => `${k}=${v}`).join("&")}#${secret}`;
    const apiSig = rand + createHash("sha512").update(toSign).digest("hex");

    const query = all.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const res = await fetch(`${CF_API}/${method}?${query}&apiSig=${apiSig}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json().catch(() => null);
    if (data?.status === "OK") return data.result as T;
    throw new CfApiError(String(data?.comment ?? `HTTP ${res.status}`));
  });
}

/**
 * Private group contests are only visible to group members, and some calls need
 * asManager=true. We try as manager first, then fall back to a plain call
 * (asManager is rejected when the key's account is not a manager of the group).
 */
async function cfContestCall<T>(
  method: string,
  params: Record<string, string | number | boolean>,
): Promise<T> {
  try {
    return await cfAuthCall<T>(method, { ...params, asManager: true });
  } catch (e) {
    if (e instanceof CfConfigError) throw e;
    return cfAuthCall<T>(method, params);
  }
}

/** Contest name, phase and problem list (one cheap standings call). */
export async function fetchCfContestInfo(contestId: number) {
  const r = await cfContestCall<{
    contest: { id: number; name: string; phase: string; startTimeSeconds?: number };
    problems: CfProblem[];
  }>("contest.standings", { contestId, from: 1, count: 1, showUnofficial: true });
  return {
    id: r.contest.id,
    name: r.contest.name,
    phase: r.contest.phase,
    startTimeSeconds: r.contest.startTimeSeconds ?? null,
    problems: r.problems.map((p) => ({ index: p.index, name: p.name })),
  };
}

/** Every submission of a contest, page by page. */
export async function fetchCfContestSubmissions(contestId: number): Promise<CfSubmission[]> {
  const PAGE = 1000;
  const out: CfSubmission[] = [];
  for (let page = 0; page < 50; page++) {
    const batch = await cfContestCall<CfSubmission[]>("contest.status", {
      contestId,
      from: 1 + page * PAGE,
      count: PAGE,
    });
    out.push(...batch);
    if (batch.length < PAGE) break;
  }
  return out;
}

/** Contests inside a group. Used by the check tool to help find the right contest id. */
export async function fetchCfGroupContests(groupCode: string) {
  const list = await cfAuthCall<{ id: number; name: string; phase: string }[]>("contest.list", {
    groupCode,
    gym: false,
  });
  return list.slice(0, 30).map((c) => ({ id: c.id, name: c.name, phase: c.phase }));
}

/**
 * Fetches rank, rating and avatar for many handles (one call per chunk).
 * A chunk that fails (for example one renamed handle) is skipped, not fatal.
 */
export async function fetchCfUsersBatch(handles: string[]): Promise<CfUser[]> {
  const CHUNK = 100;
  const out: CfUser[] = [];
  for (let i = 0; i < handles.length; i += CHUNK) {
    const chunk = handles.slice(i, i + CHUNK);
    const url = `${CF_API}/user.info?handles=${encodeURIComponent(chunk.join(";"))}`;
    const users = await enqueue(async () => {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      const data = await res.json().catch(() => null);
      return data?.status === "OK" && Array.isArray(data.result) ? (data.result as CfUser[]) : [];
    });
    out.push(...users);
  }
  return out;
}

/** Official standings of a contest (rank + members of every row), page by page. */
export async function fetchCfContestStandings(contestId: number) {
  const PAGE = 500;
  const rows: CfStandingRow[] = [];
  let meta: { phase: string; startTimeSeconds: number | null } = { phase: "", startTimeSeconds: null };
  for (let page = 0; page < 20; page++) {
    const r = await cfContestCall<{
      contest: { phase: string; startTimeSeconds?: number };
      rows: CfStandingRow[];
    }>("contest.standings", {
      contestId,
      from: 1 + page * PAGE,
      count: PAGE,
      showUnofficial: false,
    });
    meta = { phase: r.contest.phase, startTimeSeconds: r.contest.startTimeSeconds ?? null };
    rows.push(...r.rows);
    if (r.rows.length < PAGE) break;
  }
  return { ...meta, rows };
}
