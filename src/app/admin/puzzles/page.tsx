import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import { cairoToday } from "@/lib/format";
import { PUZZLE_TYPE_LABELS } from "@/lib/puzzle-labels";
import PageShell from "@/components/PageShell";
import NewPuzzleForm from "@/components/NewPuzzleForm";
import DeletePuzzleButton from "@/components/DeletePuzzleButton";
import { cardClass } from "@/components/ui";

export default async function AdminPuzzlesPage() {
  const user = await requirePageUser(STAFF);
  const today = cairoToday();

  const puzzles = await prisma.dailyPuzzle.findMany({
    orderBy: { date: "desc" },
    take: 60,
    include: { _count: { select: { solves: true } } },
  });

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-bold tracking-tight">Daily puzzles</h1>
      <NewPuzzleForm today={today} />

      <div className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold">All puzzles</h2>
        {puzzles.length === 0 ? (
          <p className="text-sm text-slate-500">No puzzles yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {puzzles.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {p.title}
                    {p.date === today && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Today
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.date} · {PUZZLE_TYPE_LABELS[p.type]} · +{p.xp} XP · {p._count.solves} solved
                  </p>
                </div>
                {user.role === "ADMIN" && <DeletePuzzleButton puzzleId={p.id} title={p.title} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
