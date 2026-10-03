"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteSheetButton({ sheetId, title }: { sheetId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (
      !window.confirm(
        `Delete "${title}"?\n\nAll XP this sheet gave to trainees will be taken back (it shows in the XP history).`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/sheets/${sheetId}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(d.error ?? "Delete failed");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={remove}
        disabled={busy}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "Deleting..." : "Delete"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
