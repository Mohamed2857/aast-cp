"use client";

import { buttonClass } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-4xl">⚠️</p>
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-sm text-slate-500">
        The page could not load. Try again, and tell an admin if it keeps happening.
      </p>
      <button onClick={reset} className={buttonClass}>
        Try again
      </button>
    </main>
  );
}
