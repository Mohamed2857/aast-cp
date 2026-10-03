"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { puzzleFormSchema, type PuzzleFormInput } from "@/lib/validators";
import { PUZZLE_TYPE_LABELS } from "@/lib/puzzle-labels";
import { buttonClass, cardClass, inputClass } from "./ui";

const err = (m?: string) => (m ? <p className="mt-1 text-xs text-red-600">{m}</p> : null);
const label = "mb-1 block text-sm font-medium";

export default function NewPuzzleForm({ today }: { today: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PuzzleFormInput>({
    resolver: zodResolver(puzzleFormSchema),
    defaultValues: {
      date: today,
      type: "BUG_HUNT",
      title: "",
      body: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correct: "0",
      explanation: "",
      xp: "10",
    },
  });

  async function onSubmit(v: PuzzleFormInput) {
    setError(null);
    const all = [v.optionA, v.optionB, v.optionC, v.optionD];
    const res = await fetch("/api/admin/puzzles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: v.date,
        type: v.type,
        title: v.title,
        body: v.body,
        options: all.filter(Boolean),
        // the correct index is relative to the non-empty list
        correctIndex: all.slice(0, Number(v.correct)).filter(Boolean).length,
        explanation: v.explanation.trim() || null,
        xp: Number(v.xp),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Something went wrong");
    reset({ ...v, title: "", body: "", optionA: "", optionB: "", optionC: "", optionD: "", explanation: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardClass} space-y-3`}>
      <h2 className="text-lg font-semibold">New puzzle</h2>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={label}>Date</label>
          <input type="date" className={inputClass} {...register("date")} />
          {err(errors.date?.message)}
        </div>
        <div>
          <label className={label}>Type</label>
          <select className={inputClass} {...register("type")}>
            {Object.entries(PUZZLE_TYPE_LABELS).map(([k, name]) => (
              <option key={k} value={k}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>XP (10 to 20)</label>
          <input type="number" min={10} max={20} className={inputClass} {...register("xp")} />
          {err(errors.xp?.message)}
        </div>
      </div>
      <div>
        <label className={label}>Title</label>
        <input className={inputClass} placeholder="Find the off-by-one" {...register("title")} />
        {err(errors.title?.message)}
      </div>
      <div>
        <label className={label}>Puzzle (code or text)</label>
        <textarea rows={8} className={`${inputClass} font-mono`} {...register("body")} />
        {err(errors.body?.message)}
      </div>

      <div className="space-y-2 rounded-lg bg-slate-50 p-3">
        <label className={label}>Options</label>
        {(["A", "B", "C", "D"] as const).map((k, i) => (
          <div key={k} className="flex items-center gap-2">
            <input type="radio" value={String(i)} {...register("correct")} title="Correct answer" />
            <input
              className={inputClass}
              placeholder={`Option ${k}${i < 2 ? "" : " (optional)"}`}
              {...register(`option${k}` as "optionA")}
            />
          </div>
        ))}
        {err(errors.optionA?.message ?? errors.optionB?.message ?? errors.correct?.message)}
        <p className="text-xs text-slate-500">Select the radio button next to the correct option.</p>
      </div>

      <div>
        <label className={label}>Explanation (shown after solving, optional)</label>
        <textarea rows={3} className={inputClass} {...register("explanation")} />
        {err(errors.explanation?.message)}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Saving..." : "Add puzzle"}
      </button>
    </form>
  );
}
