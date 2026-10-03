import type { ReactNode } from "react";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-md">
          CP
        </div>
        <p className="text-lg font-bold tracking-tight text-slate-900">ICPC AAST Aswan</p>
        <p className="text-sm text-slate-500">Train, solve, earn XP.</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
