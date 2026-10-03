import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { clearFailures, clientIp, isLockedOut, recordFailure } from "@/lib/rate-limit";

// Compared against when the email does not exist, so response time looks the same.
const dummyHash = hashPassword("not-a-real-password");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const ip = clientIp(req);
  if (await isLockedOut(email, ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !user.passwordHash || !ok) {
    await recordFailure(email, ip);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await clearFailures(email);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
