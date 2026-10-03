"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cfHandleSchema, type CfHandleInput } from "@/lib/validators";
import { buttonClass, cardClass, inputClass } from "./ui";

export interface PendingVerification {
  handle: string;
  code: string;
  expiresAt: string;
}

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function CfLinkCard({ pending }: { pending: PendingVerification | null }) {
  const router = useRouter();
  const [step, setStep] = useState<PendingVerification | null>(pending);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CfHandleInput>({ resolver: zodResolver(cfHandleSchema) });

  async function onStart(values: CfHandleInput) {
    setError(null);
    setBusy(true);
    const { ok, data } = await postJson("/api/cf/start", values);
    setBusy(false);
    if (!ok) return setError(data.error ?? "Something went wrong");
    setStep(data);
  }

  async function onVerify() {
    setError(null);
    setBusy(true);
    const { ok, data } = await postJson("/api/cf/verify");
    setBusy(false);
    if (!ok) return setError(data.error ?? "Something went wrong");
    router.refresh();
  }

  return (
    <div className={`${cardClass} space-y-4`}>
      <h2 className="text-lg font-semibold">Link your Codeforces account</h2>

      {!step ? (
        <form onSubmit={handleSubmit(onStart)} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Codeforces handle</label>
            <input className={inputClass} placeholder="e.g. tourist" {...register("handle")} />
            {errors.handle && (
              <p className="mt-1 text-xs text-red-600">{errors.handle.message}</p>
            )}
          </div>
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? "Checking..." : "Continue"}
          </button>
        </form>
      ) : (
        <div className="space-y-3 text-sm">
          <p>
            Handle: <b>{step.handle}</b>
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-slate-700">
            <li>
              Open{" "}
              <a
                href="https://codeforces.com/settings/social"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                Codeforces settings
              </a>{" "}
              (Social tab).
            </li>
            <li>Put this code in the First name field and save:</li>
          </ol>
          <code className="block rounded-lg bg-slate-100 px-3 py-2 text-base font-semibold">
            {step.code}
          </code>
          <p className="text-slate-500">
            The code expires at {new Date(step.expiresAt).toLocaleTimeString()}. After
            verification you can change your first name back.
          </p>
          <button onClick={onVerify} disabled={busy} className={buttonClass}>
            {busy ? "Verifying..." : "Verify"}
          </button>
          <button
            onClick={() => {
              setStep(null);
              setError(null);
            }}
            className="w-full text-sm text-slate-600 hover:text-slate-900"
          >
            Use a different handle
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
