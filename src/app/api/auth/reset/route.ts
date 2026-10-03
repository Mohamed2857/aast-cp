import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validators";
import { clearFailures } from "@/lib/rate-limit";
import { findValidToken, consumeToken } from "@/lib/password-reset";

const INVALID = "This link is invalid or has expired. Ask for a new one.";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? INVALID },
      { status: 400 },
    );
  }
  const { token, password } = parsed.data;

  const row = await findValidToken(token);
  if (!row) return NextResponse.json({ error: INVALID }, { status: 400 });

  // Single use: if two requests race, only one gets to delete the token.
  if (!(await consumeToken(row.id))) {
    return NextResponse.json({ error: INVALID }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: row.userId },
    data: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() },
    select: { email: true },
  });
  await prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } });
  await clearFailures(user.email);

  return NextResponse.json({ ok: true });
}
