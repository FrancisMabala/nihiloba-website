import { getCandidateApplications } from "../../../../services/shida/employment-client";
import { employmentError, employmentToken, privateEmploymentJson } from "../route-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await employmentToken();
  if (!token) return privateEmploymentJson({ error: { code: "unauthorized" } }, 401);
  try { return privateEmploymentJson({ applications: await getCandidateApplications(token) }); }
  catch (error) { return employmentError(error); }
}
