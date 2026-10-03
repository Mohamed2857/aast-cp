"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass, cardClass } from "./ui";

export default function PuzzleCard({
  puzzleId,
  title,
  typeLabel,
  body,
  options,
  xp,
  solved,
  canAnswer,
  correctIndex,
  explanation,
}: {
  puzzleId: string;
  title: string;
  typeLabel: string;
  body: string;
  options: string[];
  xp: number;
  solved: boolean;
  canAnswer: boolean;
  /** Only sent by the server once the trainee has solved it (or for staff). */
  correctIndex: number | null;
  explanation: string | null;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    if (choice === null) return;
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/puzzle/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId, choice }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMessage({ ok: false, text: data.error ?? "Something went wrong" });
    if (data.correct) {
      setMessage({ ok: true, text: data.xp > 0 ? `Correct! +${data.xp} XP` : "Correct!" });
      router.refresh();
    } else {
      setMessage({ ok: false, text: "Not quite. Think again and try another answer." });
    }
  }

  return (
    <div className={`${cardClass} space-y-3`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-slate-500">{typeLabel}</p>
        </div>
        {solved ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Solved
          </span>
        ) : (
          <span className="text-xs text-slate-500">+{xp} XP</span>
        )}
      </div>

      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
        {body}
      </pre>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const isCorrect = correctIndex === i;
          return (
            <label
              key={i}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                isCorrect
                  ? "border-green-500 bg-green-50"
                  : choice === i
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200"
              } ${solved || !canAnswer ? "" : "cursor-pointer"}`}
            >
              {!solved && canAnswer && (
                <input
                  type="radio"
                  name="choice"
                  checked={choice === i}
                  onChange={() => setChoice(i)}
                />
              )}
              {opt}
            </label>
          );
        })}
      </div>

      {(solved || correctIndex !== null) && explanation && (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{explanation}</p>
      )}

      {!solved && !canAnswer && (
        <p className="text-sm text-slate-500">Only trainees can answer the puzzle.</p>
      )}
      {!solved && canAnswer && (
        <>
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
