import { requestEmploymentCode } from "../../../../../services/shida/employment-client";
import { assertEmploymentSameOrigin, employmentError, employmentRequestBody, privateEmploymentJson } from "../../route-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rejected = assertEmploymentSameOrigin(request);
  if (rejected) return rejected;
  const body = await employmentRequestBody(request);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!/^\+?[0-9 ()-]{8,32}$/.test(phone)) return privateEmploymentJson({ error: { code: "invalid_request" } }, 422);
  try { return privateEmploymentJson(await requestEmploymentCode(phone)); }
  catch (error) { return employmentError(error); }
}
