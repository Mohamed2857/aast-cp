"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncSheetButton({ sheetId }: { sheetId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function sync() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/admin/sheets/${sheetId}/sync`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: d.error ?? "Sync failed" });
    setMsg({
      ok: true,
      text: `${d.newSolves} new solves · ${d.users} trainees · +${d.xpAwarded} XP`,
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={sync}
        disabled={busy}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? "Syncing..." : "Sync now"}
      </button>
      {msg && (
        <span className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>
      )}
    </div>
  );
}
