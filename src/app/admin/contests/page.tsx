import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import { formatCairo } from "@/lib/format";
import { parseProblems } from "@/lib/sheets";
import PageShell from "@/components/PageShell";
import NewContestForm from "@/components/NewContestForm";
import SyncContestButton from "@/components/SyncContestButton";
import DeleteContestButton from "@/components/DeleteContestButton";
import { cardClass } from "@/components/ui";

export default async function AdminContestsPage() {
  const user = await requirePageUser(STAFF);
  const contests = await prisma.contest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-bold tracking-tight">Contests</h1>
      <NewContestForm />

      <div className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold">All contests</h2>
        {contests.length === 0 ? (
          <p className="text-sm text-slate-500">No contests yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {contests.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-xs text-slate-500">
                    {c.level === null ? "All levels" : `Level ${c.level}`} · contest {c.contestId} ·{" "}
                    {parseProblems(c.problems).length} problems · {c.phase ?? "unknown phase"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.startTime ? `Starts: ${formatCairo(c.startTime)} · ` : ""}
                    {c.lastSyncedAt ? `Last sync: ${formatCairo(c.lastSyncedAt)}` : "Never synced"}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <SyncContestButton contestId={c.id} />
                  {user.role === "ADMIN" && <DeleteContestButton contestId={c.id} title={c.title} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
