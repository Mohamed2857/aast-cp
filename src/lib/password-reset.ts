import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";

const TOKEN_MINUTES = 60;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Makes a new reset token for the user (older ones are deleted). Returns the raw token for the email link. */
export async function createResetToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + TOKEN_MINUTES * 60 * 1000),
      },
    }),
  ]);
  return { token, minutes: TOKEN_MINUTES };
}

/** Returns the userId if the token is valid and not expired, otherwise null. Does not use it up. */
export async function findValidToken(token: string) {
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: { id: true, userId: true, expiresAt: true },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

/** Deletes the token. Returns false if someone else already used it (so it works only once). */
export async function consumeToken(id: string) {
  const r = await prisma.passwordResetToken.deleteMany({ where: { id } });
  return r.count === 1;
}
