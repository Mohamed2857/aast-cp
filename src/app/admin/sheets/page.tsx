import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import { formatCairo } from "@/lib/format";
import { parseProblems } from "@/lib/sheets";
import PageShell from "@/components/PageShell";
import NewSheetForm from "@/components/NewSheetForm";
import SyncSheetButton from "@/components/SyncSheetButton";
import DeleteSheetButton from "@/components/DeleteSheetButton";
import { cardClass } from "@/components/ui";

export default async function AdminSheetsPage() {
  const user = await requirePageUser(STAFF);
  const sheets = await prisma.sheet.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-semibold">Private sheets</h1>
      <NewSheetForm />

      <div className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold">All sheets</h2>
        {sheets.length === 0 ? (
          <p className="text-sm text-slate-500">No sheets yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sheets.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="text-xs text-slate-500">
                    {s.level === null ? "All levels" : `Level ${s.level}`} · contest {s.contestId} ·{" "}
                    {parseProblems(s.problems).length} problems
                    {s.challengeIndexes.length > 0 && ` (challenge: ${s.challengeIndexes.join(", ")})`}
                  </p>
                  <p className="text-xs text-slate-400">
                    {s.lastSyncedAt ? `Last sync: ${formatCairo(s.lastSyncedAt)}` : "Never synced"}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <SyncSheetButton sheetId={s.id} />
                  {user.role === "ADMIN" && <DeleteSheetButton sheetId={s.id} title={s.title} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
