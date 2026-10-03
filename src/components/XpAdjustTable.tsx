"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "./ui";

export interface TraineeXp {
  id: string;
  name: string;
  email: string;
  cfHandle: string | null;
  level: number | null;
  totalXp: number;
}

function Row({ t }: { t: TraineeXp }) {
  const router = useRouter();
  const [total, setTotal] = useState(t.totalXp);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setMsg(null);
    const n = Number(amount);
    if (!Number.isInteger(n) || n === 0) return setMsg({ ok: false, text: "Enter a whole number (negative to remove)" });
    setBusy(true);
    const res = await fetch(`/api/admin/users/${t.id}/xp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: n, reason }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: d.error ?? "Failed" });
    setTotal(d.totalXp);
    setAmount("");
    setReason("");
    setMsg({ ok: true, text: `${n > 0 ? "+" : ""}${n} XP saved` });
    router.refresh();
  }

  return (
    <li className="space-y-2 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{t.name}</p>
          <p className="truncate text-xs text-slate-500">
            {t.level === null ? "No level" : `Level ${t.level}`} · {t.cfHandle ?? "no handle"} · {t.email}
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold">{total} XP</span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          className={`${inputClass} w-24`}
          placeholder="+/- XP"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          onClick={submit}
          disabled={busy || amount === "" || reason.trim().length < 3}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {busy ? "..." : "Apply"}
        </button>
      </div>
      {msg && <p className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</p>}
    </li>
  );
}

export default function XpAdjustTable({ trainees }: { trainees: TraineeXp[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle
    ? trainees.filter((t) =>
        [t.name, t.email, t.cfHandle ?? ""].some((x) => x.toLowerCase().includes(needle)),
      )
    : trainees;

  return (
    <div className="space-y-3">
      <input
        className={inputClass}
        placeholder="Search by name, email or handle"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {shown.length === 0 ? (
        <p className="text-sm text-slate-500">No trainees found.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {shown.map((t) => (
            <Row key={t.id} t={t} />
          ))}
        </ul>
      )}
    </div>
  );
}
