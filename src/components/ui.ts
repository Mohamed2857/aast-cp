export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50";
export const labelClass = "mb-1 block text-sm font-medium text-slate-700";
export const buttonClass =
  "w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";
export const dangerButtonClass =
  "rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50";
export const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
export const pageTitleClass = "text-2xl font-bold tracking-tight text-slate-900";
export const mutedClass = "text-sm text-slate-500";
export const errorTextClass = "mt-1 text-xs text-red-600";

export const badgeClass = {
  green: "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700",
  red: "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700",
  brand: "rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700",
  slate: "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600",
};

/** Pill tab used for level filters. */
export const tabClass = (active: boolean) =>
  `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
    active
      ? "bg-brand-600 text-white shadow-sm"
      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
  }`;
