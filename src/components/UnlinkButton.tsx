"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlinkButton({ handle }: { handle: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function unlink() {
    const ok = window.confirm(
      `Unlink ${handle}? You can link a different Codeforces account afterwards. Your XP stays.`,
    );
    if (!ok) return;
    setBusy(true);
    await fetch("/api/cf/unlink", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={unlink}
      disabled={busy}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {busy ? "Unlinking..." : "Unlink"}
    </button>
  );
}
