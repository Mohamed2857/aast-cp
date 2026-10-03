import type { ReactNode } from "react";
import type { Role } from "@prisma/client";
import Nav from "./Nav";

export default function PageShell({
  user,
  children,
}: {
  user: { name: string; role: Role };
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav user={user} />
      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
