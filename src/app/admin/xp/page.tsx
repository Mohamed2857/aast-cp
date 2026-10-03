import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import PageShell from "@/components/PageShell";
import XpAdjustTable from "@/components/XpAdjustTable";
import { cardClass } from "@/components/ui";

export default async function AdminXpPage() {
  const user = await requirePageUser(STAFF);

  const trainees = await prisma.user.findMany({
    where: { role: "TRAINEE" },
    orderBy: { name: "asc" },
    take: 500,
    select: { id: true, name: true, email: true, cfHandle: true, level: true, totalXp: true },
  });

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-bold tracking-tight">Adjust XP</h1>
      <p className="text-sm text-slate-600">
        Add XP (positive number) or take it away (negative number). Every change needs a reason and
        shows up in the trainee&apos;s XP history.
      </p>
      <div className={cardClass}>
        <XpAdjustTable trainees={trainees} />
      </div>
    </PageShell>
  );
}
