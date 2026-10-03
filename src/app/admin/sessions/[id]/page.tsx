import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import { formatCairo } from "@/lib/format";
import PageShell from "@/components/PageShell";
import AttendanceTable from "@/components/AttendanceTable";

export default async function SessionAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser(STAFF);
  const { id } = await params;

  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) notFound();

  const trainees = await prisma.user.findMany({
    where: { role: "TRAINEE", ...(session.level !== null ? { level: session.level } : {}) },
    select: { id: true, name: true, cfHandle: true, cfAvatar: true },
    orderBy: { name: "asc" },
  });
  const attendances = await prisma.attendance.findMany({ where: { sessionId: id } });
  const byUser = new Map(attendances.map((a) => [a.userId, a]));

  const rows = trainees.map((t) => ({
    userId: t.id,
    name: t.name,
    cfHandle: t.cfHandle,
    cfAvatar: t.cfAvatar,
    present: byUser.get(t.id)?.present ?? false,
    active: byUser.get(t.id)?.active ?? false,
  }));

  return (
    <PageShell user={user}>
      <Link href="/admin/sessions" className="text-sm text-brand-600 hover:underline">
        ← All sessions
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{session.title}</h1>
        <p className="text-sm text-slate-600">
          {session.type === "CAMP" ? "Camp" : "Session"} ·{" "}
          {session.level === null ? "All levels" : `Level ${session.level}`} ·{" "}
          {formatCairo(session.date)}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-600">
          No trainees found for this level. {user.role === "ADMIN" ? "Set levels in the Users page." : "Ask an admin to set trainee levels."}
        </p>
      ) : (
        <AttendanceTable
          key={JSON.stringify(rows.map((r) => [r.userId, r.present, r.active]))}
          sessionId={session.id}
          sessionType={session.type}
          initialRows={rows}
        />
      )}
    </PageShell>
  );
}
