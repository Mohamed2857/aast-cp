"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sessionFormSchema, type SessionFormInput } from "@/lib/validators";
import { buttonClass, cardClass, inputClass } from "./ui";

export default function NewSessionForm({
  editing,
}: {
  /** When set, the form updates this session (title, level and date only). */
  editing?: { id: string; values: SessionFormInput };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SessionFormInput>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: editing?.values ?? { type: "SESSION", level: "" },
  });

  async function onSubmit(v: SessionFormInput) {
    setError(null);
    const res = await fetch(editing ? `/api/admin/sessions/${editing.id}` : "/api/admin/sessions", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: v.title,
        type: v.type,
        level: v.level === "" ? null : Number(v.level),
        // the browser's local time (Cairo for you) converted to a universal timestamp
        date: new Date(v.date).toISOString(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Something went wrong");
    if (editing) {
      router.push("/admin/sessions");
      router.refresh();
      return;
    }
    reset({ title: "", type: "SESSION", level: "", date: "" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardClass} space-y-3`}>
      <h2 className="text-lg font-semibold">{editing ? "Edit session" : "New session"}</h2>
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input className={inputClass} placeholder="Week 1: Binary Search" {...register("title")} />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          {editing ? (
            <>
              <input type="hidden" {...register("type")} />
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
                {editing.values.type === "CAMP" ? "Camp" : "Session"} (cannot be changed)
              </p>
            </>
          ) : (
            <select className={inputClass} {...register("type")}>
              <option value="SESSION">Session</option>
              <option value="CAMP">Camp</option>
            </select>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Level</label>
          <select className={inputClass} {...register("level")}>
            <option value="">All levels</option>
            <option value="0">Level 0</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Date and time</label>
        <input type="datetime-local" className={inputClass} {...register("date")} />
        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Saving..." : editing ? "Save changes" : "Create session"}
      </button>
    </form>
  );
}
