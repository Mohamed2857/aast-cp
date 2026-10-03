import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import { formatCairo } from "@/lib/format";
import PageShell from "@/components/PageShell";
import NewSessionForm from "@/components/NewSessionForm";
import DeleteSessionButton from "@/components/DeleteSessionButton";
import { cardClass } from "@/components/ui";

export default async function SessionsPage() {
  const user = await requirePageUser(STAFF);

  const sessions = await prisma.session.findMany({
    orderBy: { date: "desc" },
    take: 50,
    include: { attendances: { where: { present: true }, select: { id: true } } },
  });

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-semibold">Sessions</h1>
      <NewSessionForm />

      <div className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold">All sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No sessions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/admin/sessions/${s.id}`} className="min-w-0 flex-1 hover:underline">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="text-xs text-slate-500">
                    {s.type === "CAMP" ? "Camp" : "Session"} ·{" "}
                    {s.level === null ? "All levels" : `Level ${s.level}`} · {formatCairo(s.date)} ·{" "}
                    {s.attendances.length} present
                  </p>
                </Link>
                <div className="flex items-start gap-2">
                  <Link
                    href={`/admin/sessions/${s.id}/edit`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  {user.role === "ADMIN" && <DeleteSessionButton sessionId={s.id} title={s.title} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
