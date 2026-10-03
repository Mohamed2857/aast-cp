import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import PageShell from "@/components/PageShell";
import NewMaterialForm from "@/components/NewMaterialForm";
import { cardClass } from "@/components/ui";

export default async function AdminMaterialsPage() {
  const user = await requirePageUser(STAFF);

  const materials = await prisma.material.findMany({
    orderBy: [{ level: "asc" }, { week: "asc" }, { title: "asc" }],
    take: 200,
    include: { _count: { select: { completions: true } } },
  });

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-semibold">Learning materials</h1>
      <NewMaterialForm />

      <div className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold">All materials</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500">No materials yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {materials.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/learn/${m.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      Level {m.level} · Week {m.week}
                    </p>
                  </div>
                  <span className="text-sm text-slate-600">{m._count.completions} completed</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
