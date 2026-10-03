import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiUser, STAFF, ADMIN_ONLY } from "@/lib/guards";
import { updateSessionSchema } from "@/lib/validators";
import { deleteSession } from "@/lib/session-admin";

type Ctx = { params: Promise<{ id: string }> };

// The type (session or camp) is not editable: it decides how much XP attendance paid.
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const parsed = updateSessionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const { title, level, date } = parsed.data;

  try {
    await prisma.session.update({ where: { id }, data: { title, level, date: new Date(date) } });
    return NextResponse.json({ id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    throw e;
  }
}

// Deleting takes back the XP the session paid, so it is admin-only.
export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireApiUser(ADMIN_ONLY);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const result = await deleteSession(id, auth.user.id);
  if (!result) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json(result);
}
