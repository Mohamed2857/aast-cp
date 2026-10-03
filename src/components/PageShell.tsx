import Link from "next/link";
import type { ReactNode } from "react";
import type { Role } from "@prisma/client";
import LogoutButton from "./LogoutButton";

export default function PageShell({
  user,
  children,
}: {
  user: { name: string; role: Role };
  children: ReactNode;
}) {
  const isStaff = user.role === "INSTRUCTOR" || user.role === "ADMIN";
  const link = "text-sm text-slate-600 hover:text-slate-900";
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/leaderboard" className={link}>
            Leaderboard
          </Link>
          <Link href="/learn" className={link}>
            Learn
          </Link>
          <Link href="/contests" className={link}>
            Contests
          </Link>
          <Link href="/puzzle" className={link}>
            Puzzle
          </Link>
          <Link href="/profile" className={link}>
            Profile
          </Link>
          {isStaff && (
            <Link href="/admin/sessions" className={link}>
              Sessions
            </Link>
          )}
          {isStaff && (
            <Link href="/admin/sheets" className={link}>
              Sheets
            </Link>
          )}
          {isStaff && (
            <Link href="/admin/contests" className={link}>
              Manage contests
            </Link>
          )}
          {isStaff && (
            <Link href="/admin/materials" className={link}>
              Materials
            </Link>
          )}
          {isStaff && (
            <Link href="/admin/puzzles" className={link}>
              Puzzles
            </Link>
          )}
          {isStaff && (
            <Link href="/admin/xp" className={link}>
              Adjust XP
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link href="/admin/users" className={link}>
              Users
            </Link>
          )}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-500">{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">{children}</main>
    </div>
  );
}
