import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, STAFF } from "@/lib/guards";
import { createSessionSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;

  const parsed = createSessionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const { title, type, level, date } = parsed.data;
  const session = await prisma.session.create({
    data: { title, type, level, date: new Date(date) },
    select: { id: true },
  });
  return NextResponse.json({ id: session.id });
}
