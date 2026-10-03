import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import { formatCairo } from "@/lib/format";
import PageShell from "@/components/PageShell";
import NewSessionForm from "@/components/NewSessionForm";
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
              <li key={s.id}>
                <Link
                  href={`/admin/sessions/${s.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-slate-500">
                      {s.type === "CAMP" ? "Camp" : "Session"} ·{" "}
                      {s.level === null ? "All levels" : `Level ${s.level}`} ·{" "}
                      {formatCairo(s.date)}
                    </p>
                  </div>
                  <span className="text-sm text-slate-600">{s.attendances.length} present</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
