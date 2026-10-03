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
