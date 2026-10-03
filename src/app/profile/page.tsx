import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import { formatCairo } from "@/lib/format";
import { XP_LABELS } from "@/lib/xp-labels";
import CfLinkCard from "@/components/CfLinkCard";
import UnlinkButton from "@/components/UnlinkButton";
import PageShell from "@/components/PageShell";
import Avatar from "@/components/Avatar";
import { badgeClass, cardClass, mutedClass, pageTitleClass } from "@/components/ui";

export const metadata = { title: "Profile" };

// Kept outside the component: the purity lint rule forbids Date.now() during render.
function isInFuture(d: Date | null | undefined): boolean {
  return !!d && d.getTime() > Date.now();
}

export default async function ProfilePage() {
  const user = await requirePageUser();

  const history = await prisma.xpTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { id: true, amount: true, type: true, reason: true, createdAt: true },
  });

  const stillValid = isInFuture(user.verifyCodeExpiry);
  const pending =
    !user.isVerified && user.pendingCfHandle && user.verifyCode && stillValid
      ? {
          handle: user.pendingCfHandle,
          code: user.verifyCode,
          expiresAt: user.verifyCodeExpiry!.toISOString(),
        }
      : null;

  return (
    <PageShell user={user}>
      <h1 className={pageTitleClass}>Profile</h1>

      <div className={`${cardClass} flex flex-wrap items-center gap-4`}>
        <Avatar src={user.cfAvatar} name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{user.name}</p>
          <p className={`truncate ${mutedClass}`}>{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={badgeClass.brand}>{user.role}</span>
            {user.level !== null && <span className={badgeClass.slate}>Level {user.level}</span>}
          </div>
        </div>
        <div className="rounded-xl bg-brand-50 px-5 py-3 text-center">
          <p className="text-2xl font-bold text-brand-700">{user.totalXp}</p>
          <p className="text-xs font-medium text-brand-600">Total XP</p>
        </div>
      </div>

      {user.isVerified ? (
        <div className={`${cardClass} flex items-center gap-4`}>
          <div className="text-sm">
            <p className="font-medium">
              {user.cfHandle} <span className={badgeClass.green}>✓ Verified</span>
            </p>
            <p className="text-slate-600">
              {user.cfRank ?? "unrated"}
              {user.cfRating ? ` · ${user.cfRating}` : ""}
            </p>
          </div>
          <div className="ml-auto">
            <UnlinkButton handle={user.cfHandle ?? ""} />
          </div>
        </div>
      ) : (
        <CfLinkCard pending={pending} />
      )}

      <div className={cardClass}>
        <h2 className="mb-3 text-lg font-semibold">XP history</h2>
        {history.length === 0 ? (
          <p className={mutedClass}>No XP yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{XP_LABELS[h.type]}</p>
                  <p className="text-xs text-slate-500">
                    {h.reason ? `${h.reason} · ` : ""}
                    {formatCairo(h.createdAt)}
                  </p>
                </div>
                <span className={h.amount >= 0 ? "font-semibold text-green-700" : "font-semibold text-red-600"}>
                  {h.amount > 0 ? "+" : ""}
                  {h.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
