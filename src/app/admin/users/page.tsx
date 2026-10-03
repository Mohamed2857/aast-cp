import { prisma } from "@/lib/prisma";
import { requirePageUser, ADMIN_ONLY } from "@/lib/guards";
import PageShell from "@/components/PageShell";
import UserList from "@/components/UserList";
import { mutedClass, pageTitleClass } from "@/components/ui";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const admin = await requirePageUser(ADMIN_ONLY);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      level: true,
      cfHandle: true,
      cfAvatar: true,
      totalXp: true,
    },
  });

  return (
    <PageShell user={admin}>
      <div>
        <h1 className={pageTitleClass}>Users</h1>
        <p className={mutedClass}>{users.length} accounts</p>
      </div>
      <UserList users={users} selfId={admin.id} />
    </PageShell>
  );
}
