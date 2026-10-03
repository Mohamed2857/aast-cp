import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import PageShell from "@/components/PageShell";
import { cardClass } from "@/components/ui";

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const user = await requirePageUser();
  const { level } = await searchParams;
  const levelNum =
    level === "0" || level === "1" || level === "2" ? Number(level) : (user.level ?? 0);

  const materials = await prisma.material.findMany({
    where: { level: levelNum },
    orderBy: [{ week: "asc" }, { title: "asc" }],
    select: { id: true, week: true, title: true },
  });
  const done = await prisma.materialCompletion.findMany({
    where: { userId: user.id, materialId: { in: materials.map((m) => m.id) } },
    select: { materialId: true },
  });
  const doneIds = new Set(done.map((d) => d.materialId));

  const byWeek = new Map<number, typeof materials>();
  for (const m of materials) byWeek.set(m.week, [...(byWeek.get(m.week) ?? []), m]);

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-semibold">Learning Hub</h1>
      <div className="flex gap-2">
        {[0, 1, 2].map((l) => (
          <Link
            key={l}
            href={`/learn?level=${l}`}
            className={`rounded-full px-3 py-1 text-sm ${
              l === levelNum ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Level {l}
          </Link>
        ))}
      </div>

      {byWeek.size === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-slate-500">No materials for this level yet.</p>
        </div>
      ) : (
        [...byWeek.entries()].map(([week, items]) => (
          <div key={week} className={cardClass}>
            <h2 className="mb-2 text-lg font-semibold">Week {week}</h2>
            <ul className="divide-y divide-slate-100">
              {items.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/learn/${m.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50"
                  >
                    <span className="font-medium">{m.title}</span>
                    {doneIds.has(m.id) && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Completed
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </PageShell>
  );
}
