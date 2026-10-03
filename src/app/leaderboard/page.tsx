import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import { cfRankColor } from "@/lib/format";
import PageShell from "@/components/PageShell";
import { cardClass } from "@/components/ui";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const user = await requirePageUser();
  const { level } = await searchParams;
  const levelNum = level === "0" || level === "1" || level === "2" ? Number(level) : null;

  const trainees = await prisma.user.findMany({
    where: { role: "TRAINEE", ...(levelNum !== null ? { level: levelNum } : {}) },
    select: { id: true, name: true, cfHandle: true, cfAvatar: true, cfRank: true, totalXp: true },
    orderBy: [{ totalXp: "desc" }, { name: "asc" }],
    take: 200,
  });

  // Same XP = same rank (1, 2, 2, 4)
  const ranked = trainees.map((t, i) => {
    let rank = i + 1;
    if (i > 0 && trainees[i - 1].totalXp === t.totalXp) {
      rank = trainees.findIndex((x) => x.totalXp === t.totalXp) + 1;
    }
    return { ...t, rank };
  });

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      key={label}
      href={href}
      className={`rounded-full px-3 py-1 text-sm ${
        active ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-semibold">Leaderboard</h1>
      <div className="flex gap-2">
        {tab("/leaderboard", "All", levelNum === null)}
        {tab("/leaderboard?level=0", "Level 0", levelNum === 0)}
        {tab("/leaderboard?level=1", "Level 1", levelNum === 1)}
        {tab("/leaderboard?level=2", "Level 2", levelNum === 2)}
      </div>

      <div className={cardClass}>
        {ranked.length === 0 ? (
          <p className="text-sm text-slate-500">No trainees here yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ranked.map((t) => (
              <li
                key={t.id}
                className={`flex items-center gap-3 py-3 ${
                  t.id === user.id ? "-mx-3 rounded-lg bg-blue-50 px-3" : ""
                }`}
              >
                <span className="w-8 text-center text-sm font-semibold text-slate-500">
                  {t.rank}
                </span>
                {t.cfAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.cfAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-slate-200" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.name}</p>
                  <p className={`truncate text-xs ${cfRankColor(t.cfRank)}`}>
                    {t.cfHandle ?? "not linked"}
                  </p>
                </div>
                <span className="text-sm font-semibold">{t.totalXp} XP</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
