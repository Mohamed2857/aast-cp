/* eslint-disable @next/next/no-img-element */
const SIZES = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" } as const;

/** Codeforces avatar, or the first letter of the name when there is none. */
export default function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
}) {
  const cls = SIZES[size];
  if (src) return <img src={src} alt="" className={`${cls} shrink-0 rounded-full object-cover`} />;
  return (
    <div
      aria-hidden
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}
