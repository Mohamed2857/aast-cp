import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/guards";
import { puzzleSolveSchema } from "@/lib/validators";
import { parseOptions } from "@/lib/materials";
import { cairoToday } from "@/lib/format";
import { awardXp } from "@/lib/xp";

export async function POST(req: Request) {
  // XP only makes sense for trainees (they are the ones on the leaderboard)
  const auth = await requireApiUser(["TRAINEE"]);
  if ("error" in auth) return auth.error;
  const user = auth.user;

  const parsed = puzzleSolveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  const { puzzleId, choice } = parsed.data;

  const puzzle = await prisma.dailyPuzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle) return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  if (puzzle.date !== cairoToday()) {
    return NextResponse.json({ error: "Only today's puzzle can be answered" }, { status: 400 });
  }
  if (choice >= parseOptions(puzzle.options).length) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // The correct answer is checked here on the server and never sent to the browser.
  if (choice !== puzzle.correctIndex) return NextResponse.json({ correct: false });

  const result = await prisma.$transaction(async (tx) => {
    await tx.puzzleSolve.upsert({
      where: { puzzleId_userId: { puzzleId, userId: user.id } },
      create: { puzzleId, userId: user.id },
      update: {},
    });
    // eventKey makes this once per puzzle, even if the request is sent twice
    return awardXp(
      {
        userId: user.id,
        type: "DAILY_PUZZLE",
        eventKey: `puzzle:${puzzleId}:${user.id}`,
        amount: puzzle.xp,
        reason: `Daily puzzle: ${puzzle.title}`,
      },
      tx,
    );
  });

  return NextResponse.json({ correct: true, xp: result.delta });
}
