"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncContestButton({ contestId }: { contestId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function sync() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/contests/${contestId}/sync`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: d.error ?? "Sync failed" });
    setMsg({
      ok: true,
      text: `${d.participants} trainees took part · ${d.awards} awards · +${d.xpAwarded} XP`,
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={sync}
        disabled={busy}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? "Syncing..." : "Sync now"}
      </button>
      {msg && (
        <span className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>
      )}
    </div>
  );
}
