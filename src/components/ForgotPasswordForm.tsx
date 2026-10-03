"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators";
import { buttonClass, cardClass, errorTextClass, inputClass, labelClass } from "./ui";

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setServerError(data.error ?? "Something went wrong");
      return;
    }
    setSent(values.email);
  }

  if (sent) {
    return (
      <div className={`${cardClass} space-y-3 text-center`}>
        <p className="text-3xl">📧</p>
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-slate-600">
          If an account exists for <b>{sent}</b>, we sent a link to reset the password. It works for
          one hour. Check the spam folder too.
        </p>
        <Link href="/login" className="block text-sm text-brand-600 hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardClass} space-y-4`}>
      <div>
        <h1 className="text-xl font-semibold">Forgot password?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we will send you a link to choose a new password.
        </p>
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input type="email" autoComplete="email" className={inputClass} {...register("email")} />
        {errors.email && <p className={errorTextClass}>{errors.email.message}</p>}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>
      <p className="text-center text-sm text-slate-600">
        <Link href="/login" className="text-brand-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}
