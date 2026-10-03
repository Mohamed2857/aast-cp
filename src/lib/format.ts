const cairo = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Cairo",
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatCairo = (d: Date) => cairo.format(d);

/** Tailwind classes matching Codeforces rank colors. */
export function cfRankColor(rank?: string | null) {
  switch ((rank ?? "").toLowerCase()) {
    case "newbie":
      return "text-slate-500";
    case "pupil":
      return "text-green-600";
    case "specialist":
      return "text-cyan-600";
    case "expert":
      return "text-blue-600";
    case "candidate master":
      return "text-purple-600";
    case "master":
    case "international master":
      return "text-orange-500";
    case "grandmaster":
    case "international grandmaster":
    case "legendary grandmaster":
      return "text-red-600";
    default:
      return "text-slate-500";
  }
}
