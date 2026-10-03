import { prisma } from "./prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_EMAIL = 8;
const MAX_FAILS_PER_IP = 30;

export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || null;
}

const emailKey = (email: string) => `email:${email}`;
const ipKey = (ip: string) => `ip:${ip}`;

/** True when this email or this IP has too many failed logins in the last 15 minutes. */
export async function isLockedOut(email: string, ip: string | null): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { key: emailKey(email), createdAt: { gte: since } } }),
    ip
      ? prisma.loginAttempt.count({ where: { key: ipKey(ip), createdAt: { gte: since } } })
      : Promise.resolve(0),
  ]);
  return byEmail >= MAX_FAILS_PER_EMAIL || byIp >= MAX_FAILS_PER_IP;
}

export async function recordFailure(email: string, ip: string | null) {
  const data = [{ key: emailKey(email) }, ...(ip ? [{ key: ipKey(ip) }] : [])];
  await prisma.loginAttempt.createMany({ data });
}

/** A successful login (or an admin password reset) wipes the email's failures. */
export async function clearFailures(email: string) {
  await prisma.loginAttempt.deleteMany({ where: { key: emailKey(email) } });
}

/** Housekeeping: failures older than a day are no longer needed. */
export async function purgeOldAttempts() {
  const r = await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  return r.count;
}
