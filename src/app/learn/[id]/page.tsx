import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import { parseOptions } from "@/lib/materials";
import { XP_VALUES } from "@/config/xp.config";
import PageShell from "@/components/PageShell";
import CheckinQuestion from "@/components/CheckinQuestion";
import { cardClass } from "@/components/ui";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;

  // checkCorrectIndex is deliberately NOT selected: it must never reach the browser
  const m = await prisma.material.findUnique({
    where: { id },
    select: {
      id: true,
      level: true,
      week: true,
      title: true,
      slidesUrl: true,
      recordingUrl: true,
      tips: true,
      checkQuestion: true,
      checkOptions: true,
    },
  });
  if (!m) notFound();

  const completion = await prisma.materialCompletion.findUnique({
    where: { materialId_userId: { materialId: id, userId: user.id } },
    select: { id: true },
  });

  const linkClass =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm text-blue-600 hover:bg-slate-50";

  return (
    <PageShell user={user}>
      <Link href={`/learn?level=${m.level}`} className="text-sm text-blue-600 hover:underline">
        ← Level {m.level}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{m.title}</h1>
        <p className="text-sm text-slate-600">
          Level {m.level} · Week {m.week}
        </p>
      </div>

      {(m.slidesUrl || m.recordingUrl) && (
        <div className="flex gap-2">
          {m.slidesUrl && (
            <a href={m.slidesUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              Slides
            </a>
          )}
          {m.recordingUrl && (
            <a href={m.recordingUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              Recording
            </a>
          )}
        </div>
      )}

      {m.tips && (
        <div className={cardClass}>
          <h2 className="mb-2 text-lg font-semibold">Tips &amp; Tricks</h2>
          {/* plain text on purpose: no HTML injection from stored content */}
          <pre className="whitespace-pre-wrap break-words font-mono text-sm">{m.tips}</pre>
        </div>
      )}

      <CheckinQuestion
        materialId={m.id}
        question={m.checkQuestion}
        options={parseOptions(m.checkOptions)}
        completed={!!completion}
        canAnswer={user.role === "TRAINEE"}
        xp={XP_VALUES.MATERIAL_CHECKIN}
      />
    </PageShell>
  );
}
