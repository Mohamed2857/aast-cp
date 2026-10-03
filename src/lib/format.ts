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

const cairoDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" });

/** Today's calendar date in Cairo, as "YYYY-MM-DD" (the key of a DailyPuzzle). */
export const cairoToday = () => cairoDay.format(new Date());

const cairoInputParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** A date as "YYYY-MM-DDTHH:mm" in Cairo time, the format of <input type="datetime-local">. */
export function toCairoInput(d: Date) {
  const p = Object.fromEntries(cairoInputParts.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
