import { getEmploymentSession } from "../../../../services/shida/employment-client";
import { clearEmploymentToken, employmentError, employmentToken, privateEmploymentJson, migrateEmploymentToken, personalSessionBinding } from "../route-utils";

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
    if (error instanceof Error && "status" in error && error.status === 401) await clearEmploymentToken();
    return employmentError(error);
  }
}
