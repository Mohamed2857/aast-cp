import { NextResponse } from "next/server";
import { CfApiError, CfConfigError } from "./codeforces";

/** Turns Codeforces failures into readable API responses. Rethrows anything else. */
export function cfErrorResponse(e: unknown) {
  if (e instanceof CfConfigError) {
    return NextResponse.json(
      { error: "Codeforces API key/secret are not configured on the server (CF_API_KEY, CF_API_SECRET)." },
      { status: 500 },
    );
  }
  if (e instanceof CfApiError) {
    return NextResponse.json({ error: `Codeforces said: ${e.message}` }, { status: 502 });
  }
  throw e;
}
