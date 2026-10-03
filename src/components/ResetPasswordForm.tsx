"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordFormSchema, type ResetPasswordFormInput } from "@/lib/validators";
import { buttonClass, cardClass, errorTextClass, labelClass } from "./ui";
import PasswordInput from "./PasswordInput";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInput>({ resolver: zodResolver(resetPasswordFormSchema) });

  async function onSubmit(values: ResetPasswordFormInput) {
    setServerError(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: values.password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setServerError(data.error ?? "Something went wrong");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className={`${cardClass} space-y-3 text-center`}>
        <p className="text-3xl">✅</p>
        <h1 className="text-xl font-semibold">Password changed</h1>
        <p className="text-sm text-slate-600">You can log in with your new password now.</p>
        <Link href="/login" className={`${buttonClass} block`}>
          Log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardClass} space-y-4`}>
      <h1 className="text-xl font-semibold">Choose a new password</h1>

      <div>
        <label className={labelClass}>New password</label>
        <PasswordInput autoComplete="new-password" {...register("password")} />
        {errors.password && <p className={errorTextClass}>{errors.password.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Confirm new password</label>
        <PasswordInput autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className={errorTextClass}>{errors.confirmPassword.message}</p>}
      </div>

      {serverError && (
        <p className="text-sm text-red-600">
          {serverError}{" "}
          <Link href="/forgot-password" className="underline">
            Get a new link
          </Link>
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}
