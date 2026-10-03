import type { XpEventType } from "@prisma/client";

export const XP_LABELS: Record<XpEventType, string> = {
  SESSION_ATTENDANCE: "Session attendance",
  CAMP_ATTENDANCE: "Camp attendance",
  SESSION_ACTIVE: "Active in session",
  SHEET_PROBLEM: "Sheet problem",
  SHEET_CHALLENGE: "Sheet challenge problem",
  SHEET_COMPLETE: "Sheet completed",
  CONTEST_PARTICIPATION: "Contest participation",
  CONTEST_SOLVE: "Contest problem solved",
  CONTEST_UPSOLVE: "Upsolving",
  CONTEST_FIRST_SOLVE: "First to solve",
  CONTEST_PLACE_1: "Contest 1st place",
  CONTEST_PLACE_2: "Contest 2nd place",
  CONTEST_PLACE_3: "Contest 3rd place",
  DAILY_PUZZLE: "Daily puzzle",
  MATERIAL_CHECKIN: "Material check-in",
  MANUAL_ADJUSTMENT: "Manual adjustment",
};
