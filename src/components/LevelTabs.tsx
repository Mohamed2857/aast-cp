import Link from "next/link";
import { tabClass } from "./ui";

/** Level filter pills. Pass `allHref` to add an "All" tab (leaderboard); omit it for fixed levels (learn). */
export default function LevelTabs({
  base,
  current,
  withAll = false,
}: {
  base: string;
  current: number | null;
  withAll?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {withAll && (
        <Link href={base} className={tabClass(current === null)}>
          All
        </Link>
      )}
      {[0, 1, 2].map((l) => (
        <Link key={l} href={`${base}?level=${l}`} className={tabClass(current === l)}>
          Level {l}
        </Link>
      ))}
    </div>
  );
}
