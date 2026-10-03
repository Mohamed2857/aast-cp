import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncSheet } from "@/lib/sheets";
import { refreshCfProfiles } from "@/lib/cf-profiles";

export const maxDuration = 60;

/**
 * Called on a schedule (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).
 * Syncs every sheet one after another; Codeforces calls are rate-limited in codeforces.ts.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheets = await prisma.sheet.findMany({ select: { id: true, title: true } });
  const results: Record<string, unknown> = {};
  for (const s of sheets) {
    try {
      results[s.title] = await syncSheet(s.id);
    } catch (e) {
      results[s.title] = { error: e instanceof Error ? e.message : "failed" };
    }
  }
  let profiles: unknown;
  try {
    profiles = await refreshCfProfiles();
  } catch (e) {
    profiles = { error: e instanceof Error ? e.message : "failed" };
  }
  return NextResponse.json({ sheets: sheets.length, results, profiles });
}
