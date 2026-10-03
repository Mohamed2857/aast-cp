import type { XpEventType } from "@prisma/client";

/**
 * Single source of truth for XP values.
 * Change a number here and it applies everywhere.
 */
export const XP_VALUES: Record<XpEventType, number> = {
  // Attendance
  SESSION_ATTENDANCE: 30,
  CAMP_ATTENDANCE: 50,
  SESSION_ACTIVE: 5,

  // Private sheets
  SHEET_PROBLEM: 10,
  SHEET_CHALLENGE: 20,
  SHEET_COMPLETE: 50,

  // Contests
  CONTEST_PARTICIPATION: 40,
  CONTEST_SOLVE: 15,
  CONTEST_UPSOLVE: 10,
  CONTEST_FIRST_SOLVE: 0, // not defined in the plan yet; 0 = disabled

  // Contest standings
  CONTEST_PLACE_1: 100,
  CONTEST_PLACE_2: 75,
  CONTEST_PLACE_3: 50,

  // Daily puzzle: actual value comes from DailyPuzzle.xp (10 to 20)
  DAILY_PUZZLE: 10,

  // Learning hub: XP for answering a material's check-in question correctly (once per material)
  MATERIAL_CHECKIN: 20,

  // Instructor manual changes always pass an explicit amount
  MANUAL_ADJUSTMENT: 0,
};

export const PUZZLE_XP_MIN = 10;
export const PUZZLE_XP_MAX = 20;
