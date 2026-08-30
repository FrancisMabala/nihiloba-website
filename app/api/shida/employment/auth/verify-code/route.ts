import { verifyEmploymentCode } from "../../../../../services/shida/employment-client";
import { assertEmploymentSameOrigin, employmentError, employmentRequestBody, privateEmploymentJson, setEmploymentToken } from "../../route-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rejected = assertEmploymentSameOrigin(request);
  if (rejected) return rejected;
  const body = await employmentRequestBody(request);
  const challenge = typeof body?.challenge_ref === "string" ? body.challenge_ref : "";
  const code = typeof body?.code === "string" ? body.code : "";
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(challenge) || !/^\d{6}$/.test(code)) return privateEmploymentJson({ error: { code: "invalid_request" } }, 422);
  try {
    const result = await verifyEmploymentCode(challenge, code);
    await setEmploymentToken(result.token);
    return privateEmploymentJson({ authenticated: true, user: result.session });
  } catch (error) { return employmentError(error); }
}
