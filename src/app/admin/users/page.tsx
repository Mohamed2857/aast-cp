import { prisma } from "@/lib/prisma";
import { requirePageUser, ADMIN_ONLY } from "@/lib/guards";
import PageShell from "@/components/PageShell";
import UserRow from "@/components/UserRow";
import { cardClass } from "@/components/ui";

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
      totalXp: true,
    },
  });

  return (
    <PageShell user={admin}>
      <h1 className="text-2xl font-semibold">Users</h1>
      <div className={`${cardClass} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">User</th>
              <th className="py-2 font-medium">Role</th>
              <th className="py-2 font-medium">Level</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === admin.id} />
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
