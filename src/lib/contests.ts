import type { Prisma, XpEventType } from "@prisma/client";
import { prisma } from "./prisma";
import { awardXp, revokeXp } from "./xp";
import { parseProblems } from "./sheets";
import { fetchCfContestStandings, fetchCfContestSubmissions } from "./codeforces";

export interface ContestSyncSummary {
  participants: number;
  awards: number;
  xpAwarded: number;
  submissionsRead: number;
  phase: string;
}

type Solve = { cfId: number; at: number };
type SolveMap = Map<string, Map<string, Solve>>; // userId -> problem index -> earliest solve

function addEarliest(map: SolveMap, userId: string, index: string, solve: Solve) {
  const mine = map.get(userId) ?? new Map<string, Solve>();
  const prev = mine.get(index);
  if (!prev || solve.at < prev.at) mine.set(index, solve);
  map.set(userId, mine);
}

const PLACE_TYPES: XpEventType[] = ["CONTEST_PLACE_1", "CONTEST_PLACE_2", "CONTEST_PLACE_3"];

/**
 * Pulls a contest from Codeforces and pays XP to verified trainees:
 *  - participation (official participant)
 *  - each problem solved during the contest
 *  - each problem solved later (upsolve), if not already solved in the contest
 *  - top 3 places among our trainees, once the contest is FINISHED
 * Safe to run again and again: every award has its own eventKey.
 */
export async function syncContest(contestDbId: string): Promise<ContestSyncSummary> {
  const contest = await prisma.contest.findUnique({ where: { id: contestDbId } });
  if (!contest) throw new Error("Contest not found");
  const known = new Set(parseProblems(contest.problems).map((p) => p.index));

  const trainees = await prisma.user.findMany({
    where: { role: "TRAINEE", isVerified: true, cfHandle: { not: null } },
    select: { id: true, cfHandle: true },
  });
  const byHandle = new Map(trainees.map((t) => [t.cfHandle!.toLowerCase(), t.id]));

  const standings = await fetchCfContestStandings(contest.contestId);
  const subs = await fetchCfContestSubmissions(contest.contestId);

  // official participants and their Codeforces rank
  const rankOf = new Map<string, number>();
  const participated = new Set<string>();
  for (const row of standings.rows) {
    if (row.party.participantType !== "CONTESTANT") continue;
    for (const m of row.party.members) {
      const userId = byHandle.get(m.handle.toLowerCase());
      if (!userId) continue;
      participated.add(userId);
      if (!rankOf.has(userId)) rankOf.set(userId, row.rank);
    }
  }

  const inContest: SolveMap = new Map();
  const later: SolveMap = new Map();
  for (const s of subs) {
    const official = s.author.participantType === "CONTESTANT";
    for (const m of s.author.members) {
      const userId = byHandle.get(m.handle.toLowerCase());
      if (!userId) continue;
      if (official) participated.add(userId); // any official submission counts as taking part
      if (s.verdict !== "OK" || !known.has(s.problem.index)) continue;
      addEarliest(official ? inContest : later, userId, s.problem.index, {
        cfId: s.id,
        at: s.creationTimeSeconds,
      });
    }
  }

  // places: ties share a place (two trainees with the same rank are both "1st")
  const placeOf = new Map<string, number>();
  if (standings.phase === "FINISHED") {
    const ranks = [...rankOf.values()];
    for (const [userId, r] of rankOf) {
      placeOf.set(userId, 1 + ranks.filter((x) => x < r).length);
    }
  }

  // what this contest already paid (net > 0 means the award is held)
  const held = new Set(
    (
      await prisma.xpTransaction.groupBy({
        by: ["eventKey"],
        where: { eventKey: { startsWith: `contest:${contest.id}:` } },
        _sum: { amount: true },
      })
    )
      .filter((g) => (g._sum.amount ?? 0) > 0)
      .map((g) => g.eventKey),
  );

  const label = contest.title;
  const userIds = new Set([...participated, ...inContest.keys(), ...later.keys()]);
  let awards = 0;
  let xpAwarded = 0;

  for (const userId of userIds) {
    const list: { type: XpEventType; eventKey: string; reason: string }[] = [];
    const key = (...parts: string[]) => `contest:${contest.id}:${parts.join(":")}:${userId}`;

    if (participated.has(userId)) {
      list.push({
        type: "CONTEST_PARTICIPATION",
        eventKey: key("participation"),
        reason: `Contest "${label}": participation`,
      });
    }
    const solvedInContest = inContest.get(userId) ?? new Map<string, Solve>();
    for (const index of solvedInContest.keys()) {
      list.push({
        type: "CONTEST_SOLVE",
        eventKey: key("solve", index),
        reason: `Contest "${label}": solved ${index}`,
      });
    }
    for (const index of (later.get(userId) ?? new Map<string, Solve>()).keys()) {
      if (solvedInContest.has(index)) continue; // already paid as a contest solve
      list.push({
        type: "CONTEST_UPSOLVE",
        eventKey: key("upsolve", index),
        reason: `Contest "${label}": upsolved ${index}`,
      });
    }
    const place = placeOf.get(userId);
    if (place !== undefined && place <= 3) {
      list.push({
        type: PLACE_TYPES[place - 1],
        eventKey: key("place"),
        reason: `Contest "${label}": place ${place}`,
      });
    }

    const fresh = list.filter((a) => !held.has(a.eventKey));
    if (fresh.length === 0) continue;

    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        for (const a of fresh) {
          const r = await awardXp({ userId, ...a }, tx);
          if (r.applied) {
            awards++;
            xpAwarded += r.delta;
          }
        }
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
  }

  // keep a record of the accepted submissions (duplicates are skipped)
  const rows: Prisma.SubmissionCreateManyInput[] = [];
  const collect = (map: SolveMap, kind: "CONTEST" | "UPSOLVE", skip?: SolveMap) => {
    for (const [userId, mine] of map) {
      for (const [index, s] of mine) {
        if (skip?.get(userId)?.has(index)) continue;
        rows.push({
          userId,
          cfSubmissionId: BigInt(s.cfId),
          contestId: contest.contestId,
          problemIndex: index,
          verdict: "OK",
          kind,
          createdAtCf: new Date(s.at * 1000),
        });
      }
    }
  };
  collect(inContest, "CONTEST");
  collect(later, "UPSOLVE", inContest);
  for (let i = 0; i < rows.length; i += 1000) {
    await prisma.submission.createMany({ data: rows.slice(i, i + 1000), skipDuplicates: true });
  }

  await prisma.contest.update({
    where: { id: contest.id },
    data: {
      phase: standings.phase || contest.phase,
      startTime:
        standings.startTimeSeconds !== null
          ? new Date(standings.startTimeSeconds * 1000)
          : contest.startTime,
      lastSyncedAt: new Date(),
    },
  });

  return {
    participants: participated.size,
    awards,
    xpAwarded,
    submissionsRead: subs.length,
    phase: standings.phase,
  };
}

/** Deletes a contest and takes back every XP it paid (each revoke is written to the ledger). */
export async function deleteContest(contestDbId: string, staffId: string) {
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const contest = await tx.contest.findUnique({ where: { id: contestDbId } });
      if (!contest) return null;

      const paid = await tx.xpTransaction.groupBy({
        by: ["userId", "eventKey", "type"],
        where: { eventKey: { startsWith: `contest:${contestDbId}:` } },
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
            reason: `Contest deleted: ${contest.title}`,
            createdById: staffId,
          },
          tx,
        );
        if (r.applied) revoked += -r.delta;
      }

      await tx.submission.deleteMany({
        where: { contestId: contest.contestId, kind: { in: ["CONTEST", "UPSOLVE"] } },
      });
      await tx.contest.delete({ where: { id: contestDbId } });
      return { revoked };
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}
