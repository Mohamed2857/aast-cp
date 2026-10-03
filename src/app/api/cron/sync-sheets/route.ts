import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncSheet } from "@/lib/sheets";
import { syncContest } from "@/lib/contests";
import { refreshCfProfiles } from "@/lib/cf-profiles";
import { purgeOldAttempts } from "@/lib/rate-limit";

export const maxDuration = 60;

// Codeforces calls wait 2.1s each, so we stop starting new work after this long.
const BUDGET_MS = 40_000;
// Contests keep paying upsolve XP for a while after they end.
const CONTEST_WINDOW_DAYS = 60;

/**
 * Called on a schedule (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
 * Syncs sheets and recent contests, least recently synced first, then refreshes
 * Codeforces profiles. Whatever does not fit in the time budget is picked up by
 * the next run (it is first in line because it was synced longest ago).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const since = new Date(started - CONTEST_WINDOW_DAYS * 86_400_000);
  const [sheets, contests] = await Promise.all([
    prisma.sheet.findMany({ select: { id: true, title: true, lastSyncedAt: true } }),
    prisma.contest.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, title: true, lastSyncedAt: true },
    }),
  ]);

  const tasks = [
    ...sheets.map((s) => ({ kind: "sheet" as const, ...s })),
    ...contests.map((c) => ({ kind: "contest" as const, ...c })),
  ].sort((a, b) => (a.lastSyncedAt?.getTime() ?? 0) - (b.lastSyncedAt?.getTime() ?? 0));

  const results: Record<string, unknown> = {};
  const skipped: string[] = [];
  for (const t of tasks) {
    const name = `${t.kind}: ${t.title}`;
    if (Date.now() - started > BUDGET_MS) {
      skipped.push(name);
      continue;
    }
    try {
      results[name] = t.kind === "sheet" ? await syncSheet(t.id) : await syncContest(t.id);
    } catch (e) {
      results[name] = { error: e instanceof Error ? e.message : "failed" };
    }
  }

  let profiles: unknown = "skipped (out of time)";
  if (Date.now() - started <= BUDGET_MS) {
    try {
      profiles = await refreshCfProfiles();
    } catch (e) {
      profiles = { error: e instanceof Error ? e.message : "failed" };
    }
  }

  const purgedLoginAttempts = await purgeOldAttempts().catch(() => null);

  return NextResponse.json({
    synced: Object.keys(results).length,
    results,
    skipped,
    profiles,
    purgedLoginAttempts,
  });
}
