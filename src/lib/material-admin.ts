import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { revokeXp } from "./xp";

/**
 * Deletes a material and takes back the check-in XP it paid (each revoke is written
 * to the ledger), the same way deleting a sheet works.
 */
export async function deleteMaterial(materialId: string, staffId: string) {
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const material = await tx.material.findUnique({ where: { id: materialId } });
      if (!material) return null;

      const paid = await tx.xpTransaction.groupBy({
        by: ["userId", "eventKey", "type"],
        where: { eventKey: { startsWith: `material:${materialId}:` } },
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
            reason: `Material deleted: ${material.title}`,
            createdById: staffId,
          },
          tx,
        );
        if (r.applied) revoked += -r.delta;
      }

      await tx.material.delete({ where: { id: materialId } }); // completions cascade
      return { revoked };
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
}
