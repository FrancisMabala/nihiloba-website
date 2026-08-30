import { getEmploymentSession } from "../../../../services/shida/employment-client";
import { clearEmploymentToken, employmentError, employmentToken, privateEmploymentJson } from "../route-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await employmentToken();
  if (!token) return privateEmploymentJson({ error: { code: "unauthorized" } }, 401);
  try { return privateEmploymentJson({ authenticated: true, user: await getEmploymentSession(token) }); }
  catch (error) {
    if (error instanceof Error && "status" in error && error.status === 401) await clearEmploymentToken();
    return employmentError(error);
  }
}
