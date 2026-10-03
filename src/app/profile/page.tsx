import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/guards";
import { formatCairo } from "@/lib/format";
import { XP_LABELS } from "@/lib/xp-labels";
import CfLinkCard from "@/components/CfLinkCard";
import UnlinkButton from "@/components/UnlinkButton";
import PageShell from "@/components/PageShell";
import { cardClass } from "@/components/ui";

export default async function ProfilePage() {
  const user = await requirePageUser();

  const history = await prisma.xpTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { id: true, amount: true, type: true, reason: true, createdAt: true },
  });

  const stillValid = user.verifyCodeExpiry && user.verifyCodeExpiry.getTime() > Date.now();
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
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className={`${cardClass} space-y-1`}>
        <p className="text-lg font-medium">{user.name}</p>
        <p className="text-sm text-slate-600">{user.email}</p>
        <p className="text-sm text-slate-600">
          Role: {user.role}
          {user.level !== null ? ` · Level ${user.level}` : ""} · Total XP: <b>{user.totalXp}</b>
        </p>
      </div>

      {user.isVerified ? (
        <div className={`${cardClass} flex items-center gap-4`}>
          {user.cfAvatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.cfAvatar} alt="" className="h-16 w-16 rounded-full object-cover" />
          )}
          <div className="text-sm">
            <p className="font-medium">{user.cfHandle} ✓ Verified</p>
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
          <p className="text-sm text-slate-500">No XP yet.</p>
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
