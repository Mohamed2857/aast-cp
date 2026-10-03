import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { revokeXp } from "./xp";

/**
 * Deletes a session and takes back the attendance and "active" XP it paid
 * (each revoke is written to the ledger). Attendance rows are removed with it.
 */
export async function deleteSession(sessionId: string, staffId: string) {
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const session = await tx.session.findUnique({ where: { id: sessionId } });
      if (!session) return null;

      const paid = await tx.xpTransaction.groupBy({
        by: ["userId", "eventKey", "type"],
        where: {
          OR: [
            { eventKey: { startsWith: `attendance:${sessionId}:` } },
            { eventKey: { startsWith: `active:${sessionId}:` } },
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
            reason: `Session deleted: ${session.title}`,
            createdById: staffId,
          },
          tx,
        );
        if (r.applied) revoked += -r.delta;
      }

      await tx.session.delete({ where: { id: sessionId } }); // attendances cascade
      return { revoked };
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}
