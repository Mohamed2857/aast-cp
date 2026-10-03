import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-brand-600">404</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-sm text-slate-500">This page does not exist or was removed.</p>
      <Link
        href="/leaderboard"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to leaderboard
      </Link>
    </main>
  );
}
