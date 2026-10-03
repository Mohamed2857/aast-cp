import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import { parseOptions } from "@/lib/materials";
import PageShell from "@/components/PageShell";
import NewMaterialForm from "@/components/NewMaterialForm";

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser(STAFF);
  const { id } = await params;

  const m = await prisma.material.findUnique({ where: { id } });
  if (!m) notFound();

  const opts = parseOptions(m.checkOptions);
  return (
    <PageShell user={user}>
      <Link href="/admin/materials" className="text-sm text-brand-600 hover:underline">
        ← All materials
      </Link>
      <NewMaterialForm
        editing={{
          id: m.id,
          values: {
            title: m.title,
            level: String(m.level) as "0" | "1" | "2",
            week: String(m.week),
            slidesUrl: m.slidesUrl ?? "",
            recordingUrl: m.recordingUrl ?? "",
            tips: m.tips ?? "",
            checkQuestion: m.checkQuestion,
            optionA: opts[0] ?? "",
            optionB: opts[1] ?? "",
            optionC: opts[2] ?? "",
            optionD: opts[3] ?? "",
            correct: String(m.checkCorrectIndex) as "0" | "1" | "2" | "3",
          },
        }}
      />
    </PageShell>
  );
}
