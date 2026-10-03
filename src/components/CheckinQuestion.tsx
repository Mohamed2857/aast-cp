"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, cardClass } from "./ui";

export default function CheckinQuestion({
  materialId,
  question,
  options,
  completed,
  canAnswer,
  xp,
}: {
  materialId: string;
  question: string;
  options: string[];
  completed: boolean;
  canAnswer: boolean;
  xp: number;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    if (choice === null) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/materials/${materialId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choice }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMessage({ ok: false, text: data.error ?? "Something went wrong" });
    if (data.correct) {
      setMessage({ ok: true, text: data.xp > 0 ? `Correct! +${data.xp} XP` : "Correct!" });
      router.refresh();
    } else {
      setMessage({ ok: false, text: "Not quite. Go back through the material and try again." });
    }
  }

  return (
    <div className={`${cardClass} space-y-3`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Check-in question</h2>
        {completed ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Completed
          </span>
        ) : (
          <span className="text-xs text-slate-500">+{xp} XP</span>
        )}
      </div>
      <p className="text-sm">{question}</p>

      {completed ? null : !canAnswer ? (
        <p className="text-sm text-slate-500">Only trainees can answer the check-in question.</p>
      ) : (
        <>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  choice === i ? "border-blue-500 bg-brand-50" : "border-slate-200"
                }`}
              >
                <input
                  type="radio"
                  name="choice"
                  checked={choice === i}
                  onChange={() => setChoice(i)}
                />
                {opt}
              </label>
            ))}
          </div>
          {message && (
            <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
          <button onClick={submit} disabled={busy || choice === null} className={buttonClass}>
            {busy ? "Checking..." : "Submit answer"}
          </button>
        </>
      )}
    </div>
  );
}
