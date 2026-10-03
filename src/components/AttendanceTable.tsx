"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, cardClass } from "./ui";

export interface AttendanceRow {
  userId: string;
  name: string;
  cfHandle: string | null;
  cfAvatar: string | null;
  present: boolean;
  active: boolean;
}

export default function AttendanceTable({
  sessionId,
  sessionType,
  initialRows,
}: {
  sessionId: string;
  sessionType: "SESSION" | "CAMP";
  initialRows: AttendanceRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const showActive = sessionType === "SESSION";

  function update(userId: string, patch: Partial<AttendanceRow>) {
    setMessage(null);
    setRows((rs) =>
      rs.map((r) => {
        if (r.userId !== userId) return r;
        const next = { ...r, ...patch };
        if (!next.present) next.active = false; // active only makes sense for attendees
        return next;
      }),
    );
  }

  function setAllPresent(value: boolean) {
    setMessage(null);
    setRows((rs) => rs.map((r) => ({ ...r, present: value, active: value ? r.active : false })));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/sessions/${sessionId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: rows.map(({ userId, present, active }) => ({ userId, present, active })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setMessage({ ok: false, text: data.error ?? "Something went wrong" });
    setMessage({
      ok: true,
      text: `Saved. ${data.changedUsers} trainee(s) changed. XP given: +${data.awarded}, taken back: -${data.revoked}.`,
    });
    router.refresh();
  }

  const presentCount = rows.filter((r) => r.present).length;

  return (
    <div className={`${cardClass} space-y-3`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">
          Present: <b>{presentCount}</b> / {rows.length}
        </span>
        <span className="space-x-3">
          <button onClick={() => setAllPresent(true)} className="text-blue-600 hover:underline">
            Select all
          </button>
          <button onClick={() => setAllPresent(false)} className="text-slate-600 hover:underline">
            Clear
          </button>
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-2 font-medium">Trainee</th>
            <th className="py-2 text-center font-medium">Present</th>
            {showActive && <th className="py-2 text-center font-medium">Active</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId} className="border-b border-slate-100">
              <td className="py-2">
                <div className="flex items-center gap-3">
                  {r.cfAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.cfAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-slate-200" />
                  )}
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.cfHandle ?? "no handle"}</p>
                  </div>
                </div>
              </td>
              <td className="py-2 text-center">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={r.present}
                  onChange={(e) => update(r.userId, { present: e.target.checked })}
                />
              </td>
              {showActive && (
                <td className="py-2 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={r.active}
                    disabled={!r.present}
                    onChange={(e) => update(r.userId, { active: e.target.checked })}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {message && (
        <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
      )}
      <button onClick={save} disabled={saving} className={buttonClass}>
        {saving ? "Saving..." : "Save attendance"}
      </button>
    </div>
  );
}
