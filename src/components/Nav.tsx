"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@prisma/client";
import LogoutButton from "./LogoutButton";

const MAIN = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/learn", label: "Learn" },
  { href: "/contests", label: "Contests" },
  { href: "/puzzle", label: "Puzzle" },
  { href: "/profile", label: "Profile" },
];

const STAFF_LINKS = [
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/sheets", label: "Sheets" },
  { href: "/admin/contests", label: "Manage contests" },
  { href: "/admin/materials", label: "Materials" },
  { href: "/admin/puzzles", label: "Puzzles" },
  { href: "/admin/xp", label: "Adjust XP" },
];

export default function Nav({ user }: { user: { name: string; role: Role } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isStaff = user.role === "INSTRUCTOR" || user.role === "ADMIN";
  const manage = [
    ...(isStaff ? STAFF_LINKS : []),
    ...(user.role === "ADMIN" ? [{ href: "/admin/users", label: "Users" }] : []),
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const desktopLink = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
  const manageActive = manage.some((l) => isActive(l.href));

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-2.5">
        <Link href="/leaderboard" className="mr-2 flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs text-white">
            CP
          </span>
          <span className="hidden sm:inline">AAST Aswan</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {MAIN.map((l) => (
            <Link key={l.href} href={l.href} className={desktopLink(isActive(l.href))}>
              {l.label}
            </Link>
          ))}
          {manage.length > 0 && (
            <details className="group relative">
              <summary
                className={`${desktopLink(manageActive)} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}
              >
                Manage <span className="text-[10px] transition group-open:rotate-180">▼</span>
              </summary>
              <div className="absolute left-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {manage.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`block ${desktopLink(isActive(l.href))}`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </details>
          )}
        </div>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <span className="max-w-[10rem] truncate text-sm text-slate-500">{user.name}</span>
          <LogoutButton />
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="space-y-1 border-t border-slate-100 px-4 pb-4 pt-2 md:hidden">
          {MAIN.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block ${desktopLink(isActive(l.href))}`}
            >
              {l.label}
            </Link>
          ))}
          {manage.length > 0 && (
            <>
              <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Manage
              </p>
              {manage.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block ${desktopLink(isActive(l.href))}`}
                >
                  {l.label}
                </Link>
              ))}
            </>
          )}
          <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-3">
            <span className="truncate text-sm text-slate-500">{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      )}
    </nav>
  );
}
