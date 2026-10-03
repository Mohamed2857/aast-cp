import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getCurrentUser } from "./auth";

export const STAFF: Role[] = ["INSTRUCTOR", "ADMIN"];
export const ADMIN_ONLY: Role[] = ["ADMIN"];

/** For pages: redirects to /login if logged out, to /profile if the role is not allowed. */
export async function requirePageUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/profile");
  return user;
}

/** For API routes: returns { user } or { error } (a ready-to-return response). */
export async function requireApiUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Not logged in" }, { status: 401 }) } as const;
  }
  if (roles && !roles.includes(user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }
  return { user } as const;
}
