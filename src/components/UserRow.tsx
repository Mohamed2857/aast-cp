"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "./ui";

export interface UserRowData {
  id: string;
  name: string;
  email: string;
  role: "TRAINEE" | "INSTRUCTOR" | "ADMIN";
  level: number | null;
  cfHandle: string | null;
  totalXp: number;
}

export default function UserRow({ user, isSelf }: { user: UserRowData; isSelf: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [level, setLevel] = useState(user.level === null ? "" : String(user.level));
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dirty = role !== user.role || level !== (user.level === null ? "" : String(user.level));

  async function save() {
    setBusy(true);
    setStatus(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, level: level === "" ? null : Number(level) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setStatus(data.error ?? "Failed");
    setStatus("Saved");
    router.refresh();
  }

  return (
    <tr className="border-b border-slate-100 align-middle">
      <td className="py-2 pr-2">
        <p className="font-medium">{user.name}</p>
        <p className="text-xs text-slate-500">
          {user.email} · {user.cfHandle ?? "no handle"} · {user.totalXp} XP
        </p>
      </td>
      <td className="py-2 pr-2">
        <select
          className={inputClass}
          value={role}
          disabled={isSelf}
          onChange={(e) => setRole(e.target.value as UserRowData["role"])}
        >
          <option value="TRAINEE">Trainee</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="ADMIN">Admin</option>
        </select>
      </td>
      <td className="py-2 pr-2">
        <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">No level</option>
          <option value="0">Level 0</option>
          <option value="1">Level 1</option>
          <option value="2">Level 2</option>
        </select>
      </td>
      <td className="py-2 text-right">
        <button
          onClick={save}
          disabled={!dirty || busy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {busy ? "..." : "Save"}
        </button>
        {status && <p className="mt-1 text-xs text-slate-500">{status}</p>}
      </td>
    </tr>
  );
}
