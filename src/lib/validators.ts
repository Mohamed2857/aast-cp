import { z } from "zod";

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
