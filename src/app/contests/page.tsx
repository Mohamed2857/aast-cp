import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import { formatCairo } from "@/lib/format";
import { parseProblems } from "@/lib/sheets";
import { XP_VALUES } from "@/config/xp.config";
import PageShell from "@/components/PageShell";
import { cardClass } from "@/components/ui";

export default async function ContestsPage() {
  const user = await requirePageUser();

  const contests = await prisma.contest.findMany({
    orderBy: [{ startTime: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: 50,
  });

  // my XP per contest (event keys look like "contest:<contestId>:...")
  const mine = await prisma.xpTransaction.findMany({
    where: { userId: user.id, eventKey: { startsWith: "contest:" } },
    select: { eventKey: true, amount: true },
  });
  const xpByContest = new Map<string, number>();
  for (const t of mine) {
    const id = t.eventKey.split(":")[1];
    xpByContest.set(id, (xpByContest.get(id) ?? 0) + t.amount);
  }

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-semibold">Contests</h1>

      <div className={`${cardClass} text-sm text-slate-700`}>
        <p className="mb-2 font-medium">How contests give XP</p>
        <ul className="space-y-1">
          <li>Taking part: +{XP_VALUES.CONTEST_PARTICIPATION} XP</li>
          <li>Each problem solved during the contest: +{XP_VALUES.CONTEST_SOLVE} XP</li>
          <li>Each problem solved afterwards (upsolve): +{XP_VALUES.CONTEST_UPSOLVE} XP</li>
          <li>
            Top 3 among trainees: +{XP_VALUES.CONTEST_PLACE_1} / +{XP_VALUES.CONTEST_PLACE_2} / +
            {XP_VALUES.CONTEST_PLACE_3} XP
          </li>
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Your Codeforces handle must be verified. XP is added when the contest is synced.
        </p>
      </div>

      {contests.length === 0 ? (
        <div className={cardClass}>
          <p className="text-sm text-slate-500">No contests yet.</p>
        </div>
      ) : (
        <div className={cardClass}>
          <ul className="divide-y divide-slate-100">
            {contests.map((c) => {
              const xp = xpByContest.get(c.id);
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.title}</p>
                    <p className="text-xs text-slate-500">
                      {c.level === null ? "All levels" : `Level ${c.level}`} ·{" "}
                      {parseProblems(c.problems).length} problems
                      {c.startTime ? ` · ${formatCairo(c.startTime)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {xp !== undefined && xp !== 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        +{xp} XP
                      </span>
                    )}
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Open
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </PageShell>
  );
}
