import { prisma } from "./prisma";
import { fetchCfUsersBatch, normalizeAvatar } from "./codeforces";

/** Refreshes rank, rating and avatar for every verified user. Safe to run often. */
export async function refreshCfProfiles() {
  const users = await prisma.user.findMany({
    where: { isVerified: true, cfHandle: { not: null } },
    select: { id: true, cfHandle: true, cfRank: true, cfRating: true, cfAvatar: true },
  });
  const byHandle = new Map(users.map((u) => [u.cfHandle!.toLowerCase(), u]));
  const fetched = await fetchCfUsersBatch(users.map((u) => u.cfHandle!));

  let updated = 0;
  for (const cf of fetched) {
    const u = byHandle.get(cf.handle.toLowerCase());
    if (!u) continue;
    const next = {
      cfRank: cf.rank ?? null,
      cfRating: cf.rating ?? null,
      cfAvatar: normalizeAvatar(cf),
    };
    if (next.cfRank === u.cfRank && next.cfRating === u.cfRating && next.cfAvatar === u.cfAvatar) {
      continue;
    }
    await prisma.user.update({ where: { id: u.id }, data: next });
    updated++;
  }
  return { checked: users.length, found: fetched.length, updated };
}
