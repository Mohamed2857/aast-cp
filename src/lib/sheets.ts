import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { awardXp, revokeXp } from "./xp";
import { fetchCfContestSubmissions, type CfProblem } from "./codeforces";

/** Accepts .../group/CODE/contest/ID, .../contest/ID and .../gym/ID links. */
export function parseContestUrl(raw: string): { groupCode: string | null; contestId: number } | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.hostname !== "codeforces.com" && !u.hostname.endsWith(".codeforces.com")) return null;

  let m = u.pathname.match(/^\/group\/([A-Za-z0-9]+)\/contest\/(\d+)/);
  if (m) return { groupCode: m[1], contestId: Number(m[2]) };
  m = u.pathname.match(/^\/(?:contest|gym)\/(\d+)/);
  if (m) return { groupCode: null, contestId: Number(m[1]) };
  return null;
}

export function parseProblems(json: unknown): CfProblem[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (p): p is CfProblem => !!p && typeof p.index === "string" && typeof p.name === "string",
  );
}

export interface SyncSummary {
  newSolves: number;
  xpAwarded: number;
  users: number;
  submissionsRead: number;
}

/**
 * Pulls the sheet's submissions from Codeforces and pays XP for first accepted
 * solves of verified trainees. Safe to run again and again: XP is keyed per
 * (sheet, problem, user), so nothing is ever paid twice.
 */
export async function syncSheet(sheetId: string): Promise<SyncSummary> {
  const sheet = await prisma.sheet.findUnique({ where: { id: sheetId } });
  if (!sheet) throw new Error("Sheet not found");
  const problems = parseProblems(sheet.problems);
  const known = new Set(problems.map((p) => p.index));
  const challenge = new Set(sheet.challengeIndexes);

  const trainees = await prisma.user.findMany({
    where: { role: "TRAINEE", isVerified: true, cfHandle: { not: null } },
    select: { id: true, cfHandle: true },
  });
  const byHandle = new Map(trainees.map((t) => [t.cfHandle!.toLowerCase(), t.id]));

  const subs = await fetchCfContestSubmissions(sheet.contestId);

  // earliest accepted submission per (user, problem)
  type Solve = { cfId: number; at: number };
  const solved = new Map<string, Map<string, Solve>>(); // userId -> index -> solve
  for (const s of subs) {
    if (s.verdict !== "OK" || !known.has(s.problem.index)) continue;
    for (const m of s.author.members) {
      const userId = byHandle.get(m.handle.toLowerCase());
      if (!userId) continue;
      const mine = solved.get(userId) ?? new Map<string, Solve>();
      const prev = mine.get(s.problem.index);
      if (!prev || s.creationTimeSeconds < prev.at) {
        mine.set(s.problem.index, { cfId: s.id, at: s.creationTimeSeconds });
      }
      solved.set(userId, mine);
    }
  }

  const already = await prisma.submission.findMany({
    where: { contestId: sheet.contestId, kind: "SHEET", userId: { in: [...solved.keys()] } },
    select: { userId: true, problemIndex: true },
  });
  const have = new Set(already.map((a) => `${a.userId}|${a.problemIndex}`));
  const haveCount = new Map<string, number>();
  for (const a of already) haveCount.set(a.userId, (haveCount.get(a.userId) ?? 0) + 1);

  let newSolves = 0;
  let xpAwarded = 0;
  let users = 0;

  for (const [userId, mine] of solved) {
    const fresh = [...mine].filter(([index]) => !have.has(`${userId}|${index}`));
    if (fresh.length === 0) continue;

    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.submission.createMany({
          data: fresh.map(([index, s]) => ({
            userId,
            cfSubmissionId: BigInt(s.cfId),
            contestId: sheet.contestId,
            problemIndex: index,
            verdict: "OK",
            kind: "SHEET" as const,
            createdAtCf: new Date(s.at * 1000),
          })),
          skipDuplicates: true,
        });

        for (const [index] of fresh) {
          const r = await awardXp(
            {
              userId,
              type: challenge.has(index) ? "SHEET_CHALLENGE" : "SHEET_PROBLEM",
              eventKey: `sheet:${sheet.id}:${index}:${userId}`,
              reason: `Sheet "${sheet.title}": problem ${index}`,
            },
            tx,
          );
          if (r.applied) xpAwarded += r.delta;
        }

        const total = (haveCount.get(userId) ?? 0) + fresh.length;
        if (problems.length > 0 && total >= problems.length) {
          const r = await awardXp(
            {
              userId,
              type: "SHEET_COMPLETE",
              eventKey: `sheetdone:${sheet.id}:${userId}`,
              reason: `Finished sheet "${sheet.title}"`,
            },
            tx,
          );
          if (r.applied) xpAwarded += r.delta;
        }
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
    newSolves += fresh.length;
    users++;
  }

  await prisma.sheet.update({ where: { id: sheet.id }, data: { lastSyncedAt: new Date() } });
  return { newSolves, xpAwarded, users, submissionsRead: subs.length };
}

/**
 * Deletes a sheet and takes back every XP it paid (each revoke is written to the
 * ledger, so the history stays honest), then removes its stored submissions.
 */
export async function deleteSheet(sheetId: string, staffId: string) {
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const sheet = await tx.sheet.findUnique({ where: { id: sheetId } });
      if (!sheet) return null;

      const paid = await tx.xpTransaction.groupBy({
        by: ["userId", "eventKey", "type"],
        where: {
          OR: [
            { eventKey: { startsWith: `sheet:${sheetId}:` } },
            { eventKey: { startsWith: `sheetdone:${sheetId}:` } },
          ],
        },
        _sum: { amount: true },
      });

      let revoked = 0;
      for (const p of paid) {
        if ((p._sum.amount ?? 0) <= 0) continue;
        const r = await revokeXp(
          {
            userId: p.userId,
            type: p.type,
            eventKey: p.eventKey,
            reason: `Sheet deleted: ${sheet.title}`,
            createdById: staffId,
          },
          tx,
        );
        if (r.applied) revoked += -r.delta;
      }

      await tx.submission.deleteMany({ where: { contestId: sheet.contestId, kind: "SHEET" } });
      await tx.sheet.delete({ where: { id: sheetId } });
      return { revoked };
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}
