import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireApiUser, ADMIN_ONLY } from "@/lib/guards";
import { hashPassword } from "@/lib/auth";
import { clearFailures } from "@/lib/rate-limit";

// No look-alike characters (0/O, 1/l/I) so it is easy to read out loud or type.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

function tempPassword(length = 12) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/**
 * Admin sets a new random password for a user who forgot theirs. The password is
 * returned once so the admin can pass it on; only its hash is stored.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(ADMIN_ONLY);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const password = tempPassword();
  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
  await clearFailures(target.email);

  return NextResponse.json({ password });
}
