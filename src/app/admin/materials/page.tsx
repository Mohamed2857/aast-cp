import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import PageShell from "@/components/PageShell";
import NewMaterialForm from "@/components/NewMaterialForm";
import DeleteMaterialButton from "@/components/DeleteMaterialButton";
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
      <h1 className="text-2xl font-bold tracking-tight">Learning materials</h1>
      <NewMaterialForm />

      <div className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold">All materials</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500">No materials yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {materials.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <Link href={`/learn/${m.id}`} className="min-w-0 flex-1 hover:underline">
                  <p className="truncate font-medium">{m.title}</p>
                  <p className="text-xs text-slate-500">
                    Level {m.level} · Week {m.week} · {m._count.completions} completed
                  </p>
                </Link>
                <div className="flex items-start gap-2">
                  <Link
                    href={`/admin/materials/${m.id}/edit`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                  >
                    Edit
                  </Link>
                  {user.role === "ADMIN" && <DeleteMaterialButton materialId={m.id} title={m.title} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
