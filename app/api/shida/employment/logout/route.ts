import { logoutEmploymentSession } from "../../../../services/shida/employment-client";
import { cookies } from "next/headers";
import { assertEmploymentSameOrigin, clearEmploymentToken, employmentError, employmentToken, privateEmploymentJson } from "../route-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rejected = assertEmploymentSameOrigin(request);
  if (rejected) return rejected;
  const token = await employmentToken();
  try { if (token) await logoutEmploymentSession(token); }
  catch (error) { if (!(error instanceof Error && "status" in error && error.status === 401)) return employmentError(error); }
  finally {
    await clearEmploymentToken();
    (await cookies()).set("nihiloba_personal_challenge", "", { path: "/api/shida", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0 });
  }
  return privateEmploymentJson({ authenticated: false });
}
