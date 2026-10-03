import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiUser, STAFF } from "@/lib/guards";
import { createPuzzleSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;

  const parsed = createPuzzleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const puzzle = await prisma.dailyPuzzle.create({
      data: {
        date: d.date,
        type: d.type,
        title: d.title,
        body: d.body,
        options: d.options,
        correctIndex: d.correctIndex,
        explanation: d.explanation,
        xp: d.xp,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: puzzle.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "There is already a puzzle on that date" }, { status: 409 });
    }
    throw e;
  }
}
