"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "./Avatar";
import { badgeClass, buttonClass, cardClass, inputClass, secondaryButtonClass } from "./ui";

export interface UserRowData {
  id: string;
  name: string;
  email: string;
  role: "TRAINEE" | "INSTRUCTOR" | "ADMIN";
  level: number | null;
  cfHandle: string | null;
  cfAvatar?: string | null;
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
    <li className={`${cardClass} space-y-4`}>
      <div className="flex items-center gap-3">
        <Avatar src={user.cfAvatar} name={user.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {user.name}
            {isSelf && <span className="ml-2 text-xs text-brand-600">you</span>}
          </p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{user.totalXp} XP</p>
          <p className="text-xs text-slate-500">{user.cfHandle ?? "no handle"}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-500">
          Role
          <select
            className={`${inputClass} mt-1`}
            value={role}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as UserRowData["role"])}
          >
            <option value="TRAINEE">Trainee</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Level
          <select
            className={`${inputClass} mt-1`}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="">No level</option>
            <option value="0">Level 0</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={!dirty || busy}
          className={`${buttonClass} !w-auto`}
        >
          {busy ? "..." : "Save"}
        </button>
        <button onClick={resetPassword} disabled={busy} className={secondaryButtonClass}>
          Reset password
        </button>
        {status && (
          <span className={status === "Saved" ? badgeClass.green : badgeClass.red}>{status}</span>
        )}
      </div>

      {newPassword && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          New password:{" "}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono select-all">{newPassword}</code>
          <p className="mt-1 text-xs text-amber-700">Shown once. Send it to the user.</p>
        </div>
      )}
    </li>
  );
}
