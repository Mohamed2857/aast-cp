import { z } from "zod";
import { PUZZLE_XP_MIN, PUZZLE_XP_MAX } from "@/config/xp.config";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(60, "Name is too long"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    // bcrypt only uses the first 72 bytes, so we cap the length
    password: z.string().min(8, "At least 8 characters").max(72, "At most 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password").max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const cfHandleSchema = z.object({
  handle: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_.-]{3,24}$/, "Invalid Codeforces handle"),
});
export type CfHandleInput = z.infer<typeof cfHandleSchema>;

// ---- Sessions / attendance ----
export const sessionFormSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(100),
  type: z.enum(["SESSION", "CAMP"]),
  level: z.enum(["", "0", "1", "2"]), // "" = all levels
  date: z.string().min(1, "Pick a date and time"),
});
export type SessionFormInput = z.infer<typeof sessionFormSchema>;

export const createSessionSchema = z.object({
  title: z.string().trim().min(2).max(100),
  type: z.enum(["SESSION", "CAMP"]),
  level: z.number().int().min(0).max(2).nullable(),
  date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date"),
});

export const attendanceSchema = z.object({
  entries: z
    .array(
      z.object({
        userId: z.string().min(1),
        present: z.boolean(),
        active: z.boolean(),
      }),
    )
    .max(500),
});

export const updateUserSchema = z.object({
  role: z.enum(["TRAINEE", "INSTRUCTOR", "ADMIN"]).optional(),
  level: z.number().int().min(0).max(2).nullable().optional(),
});

// ---- Learning hub ----
const isHttpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

/** Form side: empty string means "no link". Only http(s) is allowed (blocks javascript: links). */
const optionalUrlField = z
  .string()
  .trim()
  .refine((v) => v === "" || isHttpUrl(v), "Must be a full http:// or https:// link");

export const materialFormSchema = z
  .object({
    title: z.string().trim().min(2, "Title is too short").max(120),
    level: z.enum(["0", "1", "2"]),
    week: z
      .string()
      .regex(/^\d{1,2}$/, "Week must be a number")
      .refine((v) => Number(v) >= 1, "Week starts at 1"),
    slidesUrl: optionalUrlField,
    recordingUrl: optionalUrlField,
    tips: z.string().max(10_000, "Tips are too long"),
    checkQuestion: z.string().trim().min(5, "Write the check-in question").max(500),
    optionA: z.string().trim().max(200),
    optionB: z.string().trim().max(200),
    optionC: z.string().trim().max(200),
    optionD: z.string().trim().max(200),
    correct: z.enum(["0", "1", "2", "3"]),
  })
  .superRefine((d, ctx) => {
    if (!d.optionA) ctx.addIssue({ code: "custom", path: ["optionA"], message: "Required" });
    if (!d.optionB) ctx.addIssue({ code: "custom", path: ["optionB"], message: "Required" });
    const opts = [d.optionA, d.optionB, d.optionC, d.optionD];
    if (!opts[Number(d.correct)]) {
      ctx.addIssue({ code: "custom", path: ["correct"], message: "The correct answer cannot be an empty option" });
    }
  });
export type MaterialFormInput = z.infer<typeof materialFormSchema>;

const serverUrl = z
  .string()
  .trim()
  .max(500)
  .refine(isHttpUrl, "Invalid link")
  .nullable();

export const createMaterialSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    level: z.number().int().min(0).max(2),
    week: z.number().int().min(1).max(52),
    slidesUrl: serverUrl,
    recordingUrl: serverUrl,
    tips: z.string().max(10_000).nullable(),
    checkQuestion: z.string().trim().min(5).max(500),
    checkOptions: z.array(z.string().trim().min(1).max(200)).min(2).max(4),
    checkCorrectIndex: z.number().int().min(0).max(3),
  })
  .refine((d) => d.checkCorrectIndex < d.checkOptions.length, {
    message: "Correct answer must be one of the options",
    path: ["checkCorrectIndex"],
  });

export const checkinSchema = z.object({
  choice: z.number().int().min(0).max(3),
});

// ---- Sheets ----
export const sheetFormSchema = z.object({
  url: z.string().trim().min(1, "Paste the contest link"),
  title: z.string().trim().min(2, "Title is too short").max(100),
  level: z.enum(["", "0", "1", "2"]), // "" = all levels
  challenge: z.string().trim().max(60), // e.g. "E, F"
});
export type SheetFormInput = z.infer<typeof sheetFormSchema>;

export const createSheetSchema = z.object({
  url: z.string().trim().min(1).max(300),
  title: z.string().trim().min(2).max(100),
  level: z.number().int().min(0).max(2).nullable(),
  challenge: z.string().trim().max(60),
});

// ---- Daily puzzle ----

const puzzleTypes = ["BUG_HUNT", "TIME_COMPLEXITY", "CODE_TRACING", "ALGORITHM_RIDDLE"] as const;
const isoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export const puzzleFormSchema = z
  .object({
    date: z.string().refine(isoDate, "Pick a date"),
    type: z.enum(puzzleTypes),
    title: z.string().trim().min(2, "Title is too short").max(120),
    body: z.string().trim().min(5, "Write the puzzle").max(5000, "Too long"),
    optionA: z.string().trim().max(200),
    optionB: z.string().trim().max(200),
    optionC: z.string().trim().max(200),
    optionD: z.string().trim().max(200),
    correct: z.enum(["0", "1", "2", "3"]),
    explanation: z.string().max(3000, "Too long"),
    xp: z
      .string()
      .regex(/^\d{1,2}$/, "Enter a number")
      .refine(
        (v) => Number(v) >= PUZZLE_XP_MIN && Number(v) <= PUZZLE_XP_MAX,
        `XP must be between ${PUZZLE_XP_MIN} and ${PUZZLE_XP_MAX}`,
      ),
  })
  .superRefine((d, ctx) => {
    if (!d.optionA) ctx.addIssue({ code: "custom", path: ["optionA"], message: "Required" });
    if (!d.optionB) ctx.addIssue({ code: "custom", path: ["optionB"], message: "Required" });
    const opts = [d.optionA, d.optionB, d.optionC, d.optionD];
    if (!opts[Number(d.correct)]) {
      ctx.addIssue({ code: "custom", path: ["correct"], message: "The correct answer cannot be an empty option" });
    }
  });
export type PuzzleFormInput = z.infer<typeof puzzleFormSchema>;

export const createPuzzleSchema = z
  .object({
    date: z.string().refine(isoDate, "Invalid date"),
    type: z.enum(puzzleTypes),
    title: z.string().trim().min(2).max(120),
    body: z.string().trim().min(5).max(5000),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().max(3000).nullable(),
    xp: z.number().int().min(PUZZLE_XP_MIN).max(PUZZLE_XP_MAX),
  })
  .refine((d) => d.correctIndex < d.options.length, {
    message: "Correct answer must be one of the options",
    path: ["correctIndex"],
  });

export const puzzleSolveSchema = z.object({
  puzzleId: z.string().min(1).max(60),
  choice: z.number().int().min(0).max(3),
});

// ---- Contests ----
export const contestFormSchema = z.object({
  url: z.string().trim().min(1, "Paste the contest link"),
  title: z.string().trim().min(2, "Title is too short").max(100),
  level: z.enum(["", "0", "1", "2"]), // "" = all levels
});
export type ContestFormInput = z.infer<typeof contestFormSchema>;

export const createContestSchema = z.object({
  url: z.string().trim().min(1).max(300),
  title: z.string().trim().min(2).max(100),
  level: z.number().int().min(0).max(2).nullable(),
});

// ---- Manual XP + session edit ----
export const adjustXpSchema = z.object({
  amount: z
    .number()
    .int("Amount must be a whole number")
    .refine((v) => v !== 0, "Amount cannot be 0")
    .refine((v) => Math.abs(v) <= 1000, "At most 1000 XP per change"),
  reason: z.string().trim().min(3, "Write a short reason").max(200, "Reason is too long"),
});

export const updateSessionSchema = z.object({
  title: z.string().trim().min(2).max(100),
  level: z.number().int().min(0).max(2).nullable(),
  date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date"),
});
