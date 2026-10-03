import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      cfHandle: null,
      cfAvatar: null,
      cfRank: null,
      cfRating: null,
      isVerified: false,
      pendingCfHandle: null,
      verifyCode: null,
      verifyCodeExpiry: null,
    },
  });
  return NextResponse.json({ ok: true });
}
