import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiUser, STAFF } from "@/lib/guards";
import { createMaterialSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;

  const parsed = createMaterialSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const material = await prisma.material.create({
      data: {
        title: d.title,
        level: d.level,
        week: d.week,
        slidesUrl: d.slidesUrl,
        recordingUrl: d.recordingUrl,
        tips: d.tips,
        checkQuestion: d.checkQuestion,
        checkOptions: d.checkOptions,
        checkCorrectIndex: d.checkCorrectIndex,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: material.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "A material with the same level, week and title already exists" },
        { status: 409 },
      );
    }
    throw e;
  }
}
