"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sheetFormSchema, type SheetFormInput } from "@/lib/validators";
import { buttonClass, cardClass, inputClass } from "./ui";

export default function NewSheetForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SheetFormInput>({
    resolver: zodResolver(sheetFormSchema),
    defaultValues: { level: "", challenge: "" },
  });

  async function onSubmit(v: SheetFormInput) {
    setError(null);
    const res = await fetch("/api/admin/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: v.url,
        title: v.title,
        level: v.level === "" ? null : Number(v.level),
        challenge: v.challenge,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Something went wrong");
    reset({ url: "", title: "", level: "", challenge: "" });
    router.refresh();
  }

  const label = "mb-1 block text-sm font-medium";
  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardClass} space-y-3`}>
      <h2 className="text-lg font-semibold">New sheet</h2>
      <div>
        <label className={label}>Codeforces contest link</label>
        <input
          className={inputClass}
          placeholder="https://codeforces.com/group/XXXX/contest/123456"
          {...register("url")}
        />
        {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url.message}</p>}
      </div>
      <div>
        <label className={label}>Title</label>
        <input className={inputClass} placeholder="Binary Search sheet" {...register("title")} />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Level</label>
          <select className={inputClass} {...register("level")}>
            <option value="">All levels</option>
            <option value="0">Level 0</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
          </select>
        </div>
        <div>
          <label className={label}>Challenge problems (optional)</label>
          <input className={inputClass} placeholder="E, F" {...register("challenge")} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Checking Codeforces..." : "Add sheet"}
      </button>
    </form>
  );
}
