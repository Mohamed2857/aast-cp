import { NextResponse } from "next/server";
import { requireApiUser, STAFF } from "@/lib/guards";
import { fetchCfContestInfo, fetchCfGroupContests } from "@/lib/codeforces";
import { cfErrorResponse } from "@/lib/cf-http";
import { parseContestUrl } from "@/lib/sheets";

/**
 * Diagnostic: open /api/admin/cf-check?url=<contest link> in the browser while logged in
 * as staff. Tells you whether the API key works and can see that contest.
 */
export async function GET(req: Request) {
  const auth = await requireApiUser(STAFF);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url).searchParams.get("url") ?? "";
  const link = parseContestUrl(url);
  if (!link) {
    return NextResponse.json({ ok: false, error: "Add ?url=<codeforces contest link>" }, { status: 400 });
  }

  try {
    const contest = await fetchCfContestInfo(link.contestId);
    return NextResponse.json({ ok: true, groupCode: link.groupCode, contest });
  } catch (e) {
    // The key may still work: list the group's contests so the right id can be found.
    let groupContests: unknown = null;
    if (link.groupCode) {
      try {
        groupContests = await fetchCfGroupContests(link.groupCode);
      } catch {
        groupContests = null;
      }
    }
    const res = cfErrorResponse(e);
    const body = await res.json();
    return NextResponse.json({ ok: false, ...body, groupContests }, { status: res.status });
  }
}
