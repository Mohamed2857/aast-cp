import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import PageShell from "@/components/PageShell";
import LevelTabs from "@/components/LevelTabs";
import { badgeClass, cardClass, mutedClass, pageTitleClass } from "@/components/ui";

export const metadata = { title: "Learning Hub" };

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
      <h1 className={pageTitleClass}>Learning Hub</h1>
      <LevelTabs base="/learn" current={levelNum} />

      {byWeek.size === 0 ? (
        <div className={cardClass}>
          <p className={mutedClass}>No materials for this level yet.</p>
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
                    className="-mx-2 flex items-center justify-between rounded-lg px-2 py-3 transition hover:bg-slate-50"
                  >
                    <span className="font-medium">{m.title}</span>
                    {doneIds.has(m.id) && (
                      <span className={badgeClass.green}>Completed</span>
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
