import type { PuzzleType } from "@prisma/client";

export const PUZZLE_TYPE_LABELS: Record<PuzzleType, string> = {
  BUG_HUNT: "Bug hunt",
  TIME_COMPLEXITY: "Time complexity",
  CODE_TRACING: "Code tracing",
  ALGORITHM_RIDDLE: "Algorithm riddle",
};
