import { getEmploymentSession } from "../../../../services/shida/employment-client";
import { employmentError, employmentToken, privateEmploymentJson, migrateEmploymentToken, personalSessionBinding } from "../route-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await employmentToken();
  if (!token) return privateEmploymentJson({ error: { code: "unauthorized" } }, 401);
  try {
    const user = await getEmploymentSession(token);
    await migrateEmploymentToken(token);
    return privateEmploymentJson({ authenticated: true, user, binding: personalSessionBinding(token) });
  }
  catch (error) {
    // A limited registration session legitimately fails this full-access check.
    // Reads must not delete it, or a newer session issued while this read ran.
    // Explicit logout remains responsible for clearing browser credentials.
    return employmentError(error);
  }
}
