import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePageUser, STAFF } from "@/lib/guards";
import { toCairoInput } from "@/lib/format";
import PageShell from "@/components/PageShell";
import NewSessionForm from "@/components/NewSessionForm";

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser(STAFF);
  const { id } = await params;

  const s = await prisma.session.findUnique({ where: { id } });
  if (!s) notFound();

  return (
    <PageShell user={user}>
      <Link href="/admin/sessions" className="text-sm text-brand-600 hover:underline">
        ← All sessions
      </Link>
      <NewSessionForm
        editing={{
          id: s.id,
          values: {
            title: s.title,
            type: s.type,
            level: s.level === null ? "" : (String(s.level) as "0" | "1" | "2"),
            date: toCairoInput(s.date),
          },
        }}
      />
    </PageShell>
  );
}
