import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiUser, STAFF } from "@/lib/guards";
import { createSheetSchema } from "@/lib/validators";
import { fetchCfContestInfo } from "@/lib/codeforces";
import { cfErrorResponse } from "@/lib/cf-http";
import { parseContestUrl } from "@/lib/sheets";

export async function POST(req: Request) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;

  const parsed = createSheetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const { url, title, level, challenge } = parsed.data;

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

  const challengeIndices = [
    ...new Set(
      challenge
        .split(/[\s,;]+/)
        .map((x) => x.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  const valid = new Set(info.problems.map((p) => p.index.toUpperCase()));
  const unknown = challengeIndices.filter((i) => !valid.has(i));
  if (unknown.length > 0) {
    return NextResponse.json(
      {
        error: `Challenge problem(s) not in this contest: ${unknown.join(", ")}. Contest problems: ${info.problems
          .map((p) => p.index)
          .join(", ")}`,
      },
      { status: 400 },
    );
  }
  // keep the exact index spelling used by Codeforces (e.g. "A1")
  const exact = info.problems
    .map((p) => p.index)
    .filter((i) => challengeIndices.includes(i.toUpperCase()));

  try {
    const sheet = await prisma.sheet.create({
      data: {
        title,
        level,
        url,
        groupCode: link.groupCode,
        contestId: link.contestId,
        problems: info.problems,
        challengeIndices: exact,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: sheet.id, problems: info.problems.length });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "This contest is already added as a sheet" }, { status: 409 });
    }
    throw e;
  }
}
