import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, ADMIN_ONLY } from "@/lib/guards";
import { updateUserSchema } from "@/lib/validators";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(ADMIN_ONLY);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const parsed = updateUserSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  // Stops an admin from locking themselves out
  if (id === auth.user.id && parsed.data.role && parsed.data.role !== "ADMIN") {
    return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
  }

  try {
    await prisma.user.update({ where: { id }, data: parsed.data });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
