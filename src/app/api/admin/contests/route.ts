import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiUser, STAFF } from "@/lib/guards";
import { createContestSchema } from "@/lib/validators";
import { fetchCfContestInfo } from "@/lib/codeforces";
import { cfErrorResponse } from "@/lib/cf-http";
import { parseContestUrl } from "@/lib/sheets";

export async function POST(req: Request) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;

  const parsed = createContestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const { url, title, level } = parsed.data;

  const link = parseContestUrl(url);
  if (!link) {
    return NextResponse.json(
      { error: "Not a Codeforces contest link (expected .../group/CODE/contest/ID)" },
      { status: 400 },
    );
  }

  let info;
  try {
    info = await fetchCfContestInfo(link.contestId);
  } catch (e) {
    return cfErrorResponse(e);
  }

  try {
    const contest = await prisma.contest.create({
      data: {
        title,
        level,
        url,
        groupCode: link.groupCode,
        contestId: link.contestId,
        problems: info.problems,
        phase: info.phase,
        startTime: info.startTimeSeconds !== null ? new Date(info.startTimeSeconds * 1000) : null,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: contest.id, problems: info.problems.length });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "This contest is already added" }, { status: 409 });
    }
    throw e;
  }
}
