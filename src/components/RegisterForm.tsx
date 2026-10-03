"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { buttonClass, cardClass, inputClass } from "./ui";
import PasswordInput from "./PasswordInput";

export default function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
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
      <h1 className="text-xl font-semibold">Create account</h1>

      <div>
        <label className="mb-1 block text-sm font-medium">Full name</label>
        <input className={inputClass} {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
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
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Confirm password</label>
        <PasswordInput {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Creating..." : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
