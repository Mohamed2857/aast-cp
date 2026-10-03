"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { inputClass } from "./ui";

/** Password field with a Show / Hide toggle. Works with react-hook-form's register(). */
export default function PasswordInput(props: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${inputClass} pr-16`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-slate-800"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
