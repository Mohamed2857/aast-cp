import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import { parseOptions } from "@/lib/materials";
import { cairoToday } from "@/lib/format";
import { PUZZLE_TYPE_LABELS } from "@/lib/puzzle-labels";
import PageShell from "@/components/PageShell";
import PuzzleCard from "@/components/PuzzleCard";
import { cardClass } from "@/components/ui";

export default async function PuzzlePage() {
  const user = await requirePageUser();
  const today = cairoToday();

  const puzzle = await prisma.dailyPuzzle.findUnique({ where: { date: today } });
  const solve = puzzle
    ? await prisma.puzzleSolve.findUnique({
        where: { puzzleId_userId: { puzzleId: puzzle.id, userId: user.id } },
        select: { id: true },
      })
    : null;

  const isStaff = user.role === "INSTRUCTOR" || user.role === "ADMIN";
  const solved = !!solve;
  // The answer only leaves the server once the trainee solved it (staff may always see it).
  const reveal = solved || isStaff;

  return (
    <PageShell user={user}>
      <h1 className="text-2xl font-semibold">Daily puzzle</h1>
      {!puzzle ? (
        <div className={cardClass}>
          <p className="text-sm text-slate-500">No puzzle for today yet. Check back later.</p>
        </div>
      ) : (
        <PuzzleCard
          puzzleId={puzzle.id}
          title={puzzle.title}
          typeLabel={PUZZLE_TYPE_LABELS[puzzle.type]}
          body={puzzle.body}
          options={parseOptions(puzzle.options)}
          xp={puzzle.xp}
          solved={solved}
          canAnswer={user.role === "TRAINEE"}
          correctIndex={reveal ? puzzle.correctIndex : null}
          explanation={reveal ? puzzle.explanation : null}
        />
      )}
    </PageShell>
  );
}
