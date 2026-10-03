import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fetchCfUser, normalizeAvatar } from "@/lib/codeforces";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (user.isVerified) {
    return NextResponse.json({ error: "Your account is already verified" }, { status: 400 });
  }
  if (!user.pendingCfHandle || !user.verifyCode || !user.verifyCodeExpiry) {
    return NextResponse.json({ error: "Start verification first" }, { status: 400 });
  }
  if (user.verifyCodeExpiry.getTime() < Date.now()) {
    return NextResponse.json({ error: "The code expired. Start again." }, { status: 400 });
  }

  let cf;
  try {
    cf = await fetchCfUser(user.pendingCfHandle);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not reach Codeforces. Try again in a minute." },
      { status: 502 },
    );
  }
  if (!cf) return NextResponse.json({ error: "Handle not found on Codeforces" }, { status: 404 });

  if ((cf.firstName ?? "").trim() !== user.verifyCode) {
    return NextResponse.json(
      {
        error:
          "First Name on Codeforces does not match the code yet. Save it there, wait a few seconds, and try again.",
      },
      { status: 400 },
    );
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        cfHandle: cf.handle,
        cfAvatar: normalizeAvatar(cf),
        cfRank: cf.rank ?? null,
        cfRating: cf.rating ?? null,
        isVerified: true,
        pendingCfHandle: null,
        verifyCode: null,
        verifyCodeExpiry: null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "This handle is already linked to another account" },
        { status: 409 },
      );
    }
    throw e;
  }
  return NextResponse.json({ ok: true });
}
