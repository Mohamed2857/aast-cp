import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiUser, STAFF, ADMIN_ONLY } from "@/lib/guards";
import { createMaterialSchema } from "@/lib/validators";
import { deleteMaterial } from "@/lib/material-admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const parsed = createMaterialSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    await prisma.material.update({
      where: { id },
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
    });
    return NextResponse.json({ id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") return NextResponse.json({ error: "Material not found" }, { status: 404 });
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "A material with the same level, week and title already exists" },
          { status: 409 },
        );
      }
    }
    throw e;
  }
}

// Deleting takes back XP that trainees earned from this material, so it is admin-only.
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireApiUser(ADMIN_ONLY);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const result = await deleteMaterial(id, auth.user.id);
  if (!result) return NextResponse.json({ error: "Material not found" }, { status: 404 });
  return NextResponse.json(result);
}
