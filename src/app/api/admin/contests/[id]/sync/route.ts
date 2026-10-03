import { NextResponse } from "next/server";
import { requireApiUser, STAFF } from "@/lib/guards";
import { syncContest } from "@/lib/contests";
import { cfErrorResponse } from "@/lib/cf-http";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  try {
    return NextResponse.json(await syncContest(id));
  } catch (e) {
    if (e instanceof Error && e.message === "Contest not found") {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }
    return cfErrorResponse(e);
  }
}
