import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, STAFF } from "@/lib/guards";
import { attendanceSchema } from "@/lib/validators";
import { awardXp, revokeXp } from "@/lib/xp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;
  const staff = auth.user;
  const { id: sessionId } = await params;

  const parsed = attendanceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const isCamp = session.type === "CAMP";
  // "active" only exists for regular sessions, and only for people who attended
  const entries = parsed.data.entries.map((e) => ({
    ...e,
    active: e.present && e.active && !isCamp,
  }));

  // Never trust ids from the browser: keep only real trainees
  const userIds = entries.map((e) => e.userId);
  const trainees = await prisma.user.findMany({
    where: { id: { in: userIds }, role: "TRAINEE" },
    select: { id: true },
  });
  const valid = new Set(trainees.map((t) => t.id));

  const existing = await prisma.attendance.findMany({
    where: { sessionId, userId: { in: userIds } },
  });
  const prev = new Map(existing.map((a) => [a.userId, a]));

  // Only touch trainees whose state actually changed (keeps the transaction small and fast)
  const changed = entries.filter((e) => {
    if (!valid.has(e.userId)) return false;
    const p = prev.get(e.userId);
    return (p?.present ?? false) !== e.present || (p?.active ?? false) !== e.active;
  });

  const attendType = isCamp ? "CAMP_ATTENDANCE" : "SESSION_ATTENDANCE";
  let awarded = 0;
  let revoked = 0;
  const tally = (r: { applied: boolean; delta: number }) => {
    if (!r.applied) return;
    if (r.delta > 0) awarded += r.delta;
    else revoked += -r.delta;
  };

  await prisma.$transaction(
    async (tx) => {
      for (const e of changed) {
        await tx.attendance.upsert({
          where: { sessionId_userId: { sessionId, userId: e.userId } },
          create: { sessionId, userId: e.userId, present: e.present, active: e.active },
          update: { present: e.present, active: e.active },
        });

        const base = { userId: e.userId, createdById: staff.id };

        const attendKey = `attendance:${sessionId}:${e.userId}`;
        tally(
          e.present
            ? await awardXp(
                { ...base, type: attendType, eventKey: attendKey, reason: `Attended: ${session.title}` },
                tx,
              )
            : await revokeXp(
                { ...base, type: attendType, eventKey: attendKey, reason: `Attendance removed: ${session.title}` },
                tx,
              ),
        );

        if (!isCamp) {
          const activeKey = `active:${sessionId}:${e.userId}`;
          tally(
            e.active
              ? await awardXp(
                  { ...base, type: "SESSION_ACTIVE", eventKey: activeKey, reason: `Active in: ${session.title}` },
                  tx,
                )
              : await revokeXp(
                  { ...base, type: "SESSION_ACTIVE", eventKey: activeKey, reason: `Active removed: ${session.title}` },
                  tx,
                ),
          );
        }
      }
    },
    { timeout: 60_000, maxWait: 10_000 },
  );

  return NextResponse.json({ changedUsers: changed.length, awarded, revoked });
}
