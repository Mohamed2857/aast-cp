import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import { cfRankColor } from "@/lib/format";
import PageShell from "@/components/PageShell";
import Avatar from "@/components/Avatar";
import LevelTabs from "@/components/LevelTabs";
import { cardClass, mutedClass, pageTitleClass } from "@/components/ui";

export const metadata = { title: "Leaderboard" };

const MEDALS = ["🥇", "🥈", "🥉"];

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

  // Same XP = same rank (1, 2, 2, 4). One pass instead of a findIndex per row.
  const ranked: ((typeof trainees)[number] & { rank: number })[] = [];
  trainees.forEach((t, i) => {
    const rank = i > 0 && trainees[i - 1].totalXp === t.totalXp ? ranked[i - 1].rank : i + 1;
    ranked.push({ ...t, rank });
  });

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <PageShell user={user}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={pageTitleClass}>Leaderboard</h1>
          <p className={mutedClass}>{ranked.length} trainees ranked by XP</p>
        </div>
        <LevelTabs base="/leaderboard" current={levelNum} withAll />
      </div>

      {ranked.length === 0 ? (
        <div className={cardClass}>
          <p className={mutedClass}>No trainees here yet.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {podium.map((t) => (
              <div
                key={t.id}
                className={`${cardClass} flex flex-col items-center text-center ${
                  t.id === user.id ? "ring-2 ring-brand-500" : ""
                }`}
              >
                <span className="text-2xl">{MEDALS[Math.min(t.rank, 3) - 1]}</span>
                <div className="mt-2">
                  <Avatar src={t.cfAvatar} name={t.name} size="lg" />
                </div>
                <p className="mt-2 w-full truncate font-semibold">{t.name}</p>
                <p className={`w-full truncate text-xs ${cfRankColor(t.cfRank)}`}>
                  {t.cfHandle ?? "not linked"}
                </p>
                <p className="mt-2 text-lg font-bold text-brand-700">{t.totalXp} XP</p>
              </div>
            ))}
          </div>

          {rest.length > 0 && (
            <div className={`${cardClass} !p-2 sm:!p-3`}>
              <ul className="divide-y divide-slate-100">
                {rest.map((t) => (
                  <li
                    key={t.id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 ${
                      t.id === user.id ? "bg-brand-50" : ""
                    }`}
                  >
                    <span className="w-8 text-center text-sm font-semibold text-slate-400">
                      {t.rank}
                    </span>
                    <Avatar src={t.cfAvatar} name={t.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {t.name}
                        {t.id === user.id && <span className="ml-2 text-xs text-brand-600">you</span>}
                      </p>
                      <p className={`truncate text-xs ${cfRankColor(t.cfRank)}`}>
                        {t.cfHandle ?? "not linked"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{t.totalXp} XP</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
