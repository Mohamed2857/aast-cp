export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-4 px-4 py-8" aria-busy="true">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="h-24 rounded-2xl bg-slate-200" />
      <div className="h-24 rounded-2xl bg-slate-200" />
      <div className="h-24 rounded-2xl bg-slate-200" />
    </div>
  );
}
