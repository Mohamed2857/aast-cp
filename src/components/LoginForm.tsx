"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { buttonClass, cardClass, inputClass } from "./ui";
import PasswordInput from "./PasswordInput";

export default function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setServerError(data.error ?? "Something went wrong");
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${cardClass} space-y-4`}>
      <h1 className="text-xl font-semibold">Log in</h1>

      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input type="email" className={inputClass} {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Password</label>
        <PasswordInput {...register("password")} />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
        <div className="mt-1 text-right">
          <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>
      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
