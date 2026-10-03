"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { materialFormSchema, type MaterialFormInput } from "@/lib/validators";
import { buttonClass, cardClass, inputClass } from "./ui";

const err = (m?: string) => (m ? <p className="mt-1 text-xs text-red-600">{m}</p> : null);
const label = "mb-1 block text-sm font-medium";

export default function NewMaterialForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormInput>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      level: "0",
      week: "1",
      slidesUrl: "",
      recordingUrl: "",
      tips: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correct: "0",
    },
  });

  async function onSubmit(v: MaterialFormInput) {
    setError(null);
    const res = await fetch("/api/admin/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: v.title,
        level: Number(v.level),
        week: Number(v.week),
        slidesUrl: v.slidesUrl || null,
        recordingUrl: v.recordingUrl || null,
        tips: v.tips.trim() || null,
        checkQuestion: v.checkQuestion,
        // keep the original positions: the correct index is relative to the non-empty list
        checkOptions: [v.optionA, v.optionB, v.optionC, v.optionD].filter(Boolean),
        checkCorrectIndex: [v.optionA, v.optionB, v.optionC, v.optionD]
          .slice(0, Number(v.correct))
          .filter(Boolean).length,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Something went wrong");
    reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardClass} space-y-3`}>
      <h2 className="text-lg font-semibold">New material</h2>
      <div>
        <label className={label}>Title</label>
        <input className={inputClass} placeholder="Binary Search" {...register("title")} />
        {err(errors.title?.message)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Level</label>
          <select className={inputClass} {...register("level")}>
            <option value="0">Level 0</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
          </select>
        </div>
        <div>
          <label className={label}>Week</label>
          <input type="number" min={1} className={inputClass} {...register("week")} />
          {err(errors.week?.message)}
        </div>
      </div>
      <div>
        <label className={label}>Slides link (optional)</label>
        <input className={inputClass} placeholder="https://..." {...register("slidesUrl")} />
        {err(errors.slidesUrl?.message)}
      </div>
      <div>
        <label className={label}>Recording link (optional)</label>
        <input className={inputClass} placeholder="https://..." {...register("recordingUrl")} />
        {err(errors.recordingUrl?.message)}
      </div>
      <div>
        <label className={label}>Tips &amp; Tricks (optional)</label>
        <textarea rows={5} className={inputClass} {...register("tips")} />
        {err(errors.tips?.message)}
      </div>

      <div className="space-y-2 rounded-lg bg-slate-50 p-3">
        <label className={label}>Check-in question</label>
        <input className={inputClass} {...register("checkQuestion")} />
        {err(errors.checkQuestion?.message)}
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Saving..." : "Add material"}
      </button>
    </form>
  );
}
