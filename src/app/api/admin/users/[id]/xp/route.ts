import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, STAFF } from "@/lib/guards";
import { adjustXpSchema } from "@/lib/validators";
import { adjustXp } from "@/lib/xp";

/** Staff adds or removes XP by hand. Always written to the ledger with a reason. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const parsed = adjustXpSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const { amount, reason } = parsed.data;

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, totalXp: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role !== "TRAINEE") {
    return NextResponse.json({ error: "XP can only be changed for trainees" }, { status: 400 });
  }
  if (target.totalXp + amount < 0) {
    return NextResponse.json(
      { error: `Total XP cannot go below 0 (this trainee has ${target.totalXp})` },
      { status: 400 },
    );
  }

  await adjustXp({ userId: id, amount, reason, createdById: auth.user.id });
  const fresh = await prisma.user.findUnique({ where: { id }, select: { totalXp: true } });
  return NextResponse.json({ ok: true, totalXp: fresh?.totalXp ?? target.totalXp + amount });
}
