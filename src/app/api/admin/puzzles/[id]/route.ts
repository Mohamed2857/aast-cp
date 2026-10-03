import { NextResponse } from "next/server";
import { requireApiUser, ADMIN_ONLY } from "@/lib/guards";
import { deletePuzzle } from "@/lib/puzzle-admin";

// Deleting takes back XP trainees earned from the puzzle, so it is admin-only.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiUser(ADMIN_ONLY);
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const result = await deletePuzzle(id, auth.user.id);
  if (!result) return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  return NextResponse.json(result);
}
