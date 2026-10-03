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
  const [newPassword, setNewPassword] = useState<string | null>(null);

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

  async function resetPassword() {
    if (
      !window.confirm(
        `Reset the password of ${user.name}?\n\nA new random password will be shown once. Their old password stops working.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setStatus(null);
    setNewPassword(null);
    const res = await fetch(`/api/admin/users/${user.id}/password`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setStatus(data.error ?? "Failed");
    setNewPassword(data.password);
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
        <button
          onClick={resetPassword}
          disabled={busy}
          className="ml-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
        >
          Reset password
        </button>
        {newPassword && (
          <p className="mt-1 text-xs text-slate-600">
            New password: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{newPassword}</code>
            <br />
            <span className="text-slate-400">Shown once. Send it to the user.</span>
          </p>
        )}
        {status && <p className="mt-1 text-xs text-slate-500">{status}</p>}
      </td>
    </tr>
  );
}
