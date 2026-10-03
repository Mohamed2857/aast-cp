import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { revokeXp } from "./xp";

/** Deletes a puzzle and takes back the XP it paid (every revoke is written to the ledger). */
export async function deletePuzzle(puzzleId: string, staffId: string) {
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const puzzle = await tx.dailyPuzzle.findUnique({ where: { id: puzzleId } });
      if (!puzzle) return null;

      const paid = await tx.xpTransaction.groupBy({
        by: ["userId", "eventKey", "type"],
        where: { eventKey: { startsWith: `puzzle:${puzzleId}:` } },
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
            reason: `Puzzle deleted: ${puzzle.title}`,
            createdById: staffId,
          },
          tx,
        );
        if (r.applied) revoked += -r.delta;
      }

      await tx.dailyPuzzle.delete({ where: { id: puzzleId } }); // solves cascade
      return { revoked };
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}
