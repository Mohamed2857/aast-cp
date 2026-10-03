import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cfHandleSchema } from "@/lib/validators";
import { fetchCfUser } from "@/lib/codeforces";

const CODE_TTL_MS = 15 * 60 * 1000;
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // no look-alike characters

function makeCode() {
  const bytes = randomBytes(5);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `AAST-${out}`;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (user.isVerified) {
    return NextResponse.json({ error: "Your account is already verified" }, { status: 400 });
  }

  const parsed = cfHandleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid handle" },
      { status: 400 },
    );
  }

  let cf;
  try {
    cf = await fetchCfUser(parsed.data.handle);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not reach Codeforces. Try again in a minute." },
      { status: 502 },
    );
  }
  if (!cf) return NextResponse.json({ error: "Handle not found on Codeforces" }, { status: 404 });

  const taken = await prisma.user.findFirst({
    where: { cfHandle: { equals: cf.handle, mode: "insensitive" }, id: { not: user.id } },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json(
      { error: "This handle is already linked to another account" },
      { status: 409 },
    );
  }

  const code = makeCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await prisma.user.update({
    where: { id: user.id },
    data: { pendingCfHandle: cf.handle, verifyCode: code, verifyCodeExpiry: expiresAt },
  });

  return NextResponse.json({ handle: cf.handle, code, expiresAt: expiresAt.toISOString() });
}
