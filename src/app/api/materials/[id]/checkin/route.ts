import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/guards";
import { checkinSchema } from "@/lib/validators";
import { awardXp } from "@/lib/xp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // XP only makes sense for trainees (they are the ones on the leaderboard)
  const auth = await requireApiUser(["TRAINEE"]);
  if ("error" in auth) return auth.error;
  const user = auth.user;
  const { id } = await params;

  const parsed = checkinSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const material = await prisma.material.findUnique({
    where: { id },
    select: { title: true, checkCorrectIndex: true },
  });
  if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  // The correct answer is checked here on the server and never sent to the browser.
  if (parsed.data.choice !== material.checkCorrectIndex) {
    return NextResponse.json({ correct: false });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.materialCompletion.upsert({
      where: { materialId_userId: { materialId: id, userId: user.id } },
      create: { materialId: id, userId: user.id },
      update: {},
    });
    // eventKey makes this once-per-material, even if the request is sent twice
    return awardXp(
      {
        userId: user.id,
        type: "MATERIAL_CHECKIN",
        eventKey: `material:${id}:${user.id}`,
        reason: `Material check-in: ${material.title}`,
      },
      tx,
    );
  });

  return NextResponse.json({ correct: true, xp: result.delta });
}
