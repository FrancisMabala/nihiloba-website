import { getCandidateApplication } from "../../../../../services/shida/employment-client";
import { employmentError, employmentToken, privateEmploymentJson, validApplicationReference } from "../../route-utils";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ application: string }> }) {
  const token = await employmentToken();
  if (!token) return privateEmploymentJson({ error: { code: "unauthorized" } }, 401);
  const reference = (await params).application;
  if (!validApplicationReference(reference)) return privateEmploymentJson({ error: { code: "not_found" } }, 404);
  try { return privateEmploymentJson({ application: await getCandidateApplication(token, reference) }); }
  catch (error) { return employmentError(error); }
}
