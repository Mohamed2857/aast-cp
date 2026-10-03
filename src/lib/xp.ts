import type { Prisma, XpEventType } from "@prisma/client";
import { prisma } from "./prisma";
import { XP_VALUES } from "@/config/xp.config";

type Tx = Prisma.TransactionClient;

export type XpResult = { applied: boolean; delta: number };

interface AwardInput {
  userId: string;
  type: XpEventType;
  /** Identifies the thing that earned the XP, e.g. `attendance:${sessionId}:${userId}` */
  eventKey: string;
  /** Overrides the default value from xp.config.ts */
  amount?: number;
  reason?: string;
  createdById?: string;
}

/** Runs fn inside the given transaction, or opens a new one. */
async function withTx<T>(fn: (tx: Tx) => Promise<T>, tx?: Tx): Promise<T> {
  return tx ? fn(tx) : prisma.$transaction(fn);
}

/** Locks the user row so concurrent XP changes for the same user run one at a time. */
async function lockUser(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

async function netForEvent(tx: Tx, userId: string, eventKey: string) {
  const agg = await tx.xpTransaction.aggregate({
    where: { userId, eventKey },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

/**
 * Awards XP once per eventKey. Safe to call repeatedly:
 * if the user already holds this award, nothing happens.
 * After a revoke, calling it again re-awards.
 */
export async function awardXp(input: AwardInput, tx?: Tx): Promise<XpResult> {
  const amount = input.amount ?? XP_VALUES[input.type];
  if (amount <= 0) return { applied: false, delta: 0 };

  return withTx(async (t) => {
    await lockUser(t, input.userId);

    const net = await netForEvent(t, input.userId, input.eventKey);
    if (net > 0) return { applied: false, delta: 0 };

    await t.xpTransaction.create({
      data: {
        userId: input.userId,
        amount,
        type: input.type,
        eventKey: input.eventKey,
        reason: input.reason,
        createdById: input.createdById,
      },
    });
    await t.user.update({
      where: { id: input.userId },
      data: { totalXp: { increment: amount } },
    });
    return { applied: true, delta: amount };
  }, tx);
}

/**
 * Takes back whatever XP this eventKey currently holds
 * (e.g. an instructor un-marks attendance). No-op if nothing is held.
 */
export async function revokeXp(
  input: Omit<AwardInput, "amount">,
  tx?: Tx,
): Promise<XpResult> {
  return withTx(async (t) => {
    await lockUser(t, input.userId);

    const net = await netForEvent(t, input.userId, input.eventKey);
    if (net <= 0) return { applied: false, delta: 0 };

    await t.xpTransaction.create({
      data: {
        userId: input.userId,
        amount: -net,
        type: input.type,
        eventKey: input.eventKey,
        reason: input.reason ?? "Revoked",
        createdById: input.createdById,
      },
    });
    await t.user.update({
      where: { id: input.userId },
      data: { totalXp: { decrement: net } },
    });
    return { applied: true, delta: -net };
  }, tx);
}

/** Instructor-driven manual change (positive or negative). Always recorded, never deduped. */
export async function adjustXp(
  input: { userId: string; amount: number; reason: string; createdById: string },
  tx?: Tx,
): Promise<XpResult> {
  if (input.amount === 0) return { applied: false, delta: 0 };

  return withTx(async (t) => {
    await lockUser(t, input.userId);
    await t.xpTransaction.create({
      data: {
        userId: input.userId,
        amount: input.amount,
        type: "MANUAL_ADJUSTMENT",
        eventKey: `manual:${crypto.randomUUID()}`,
        reason: input.reason,
        createdById: input.createdById,
      },
    });
    await t.user.update({
      where: { id: input.userId },
      data: { totalXp: { increment: input.amount } },
    });
    return { applied: true, delta: input.amount };
  }, tx);
}
