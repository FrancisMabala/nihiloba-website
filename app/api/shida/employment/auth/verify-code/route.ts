import { verifyEmploymentCode } from "../../../../../services/shida/employment-client";
import { personalRequestOrigin } from "../../../../../lib/personal-request-origin";
import { employmentError, employmentRequestBody, privateEmploymentJson, setEmploymentToken } from "../../route-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = personalRequestOrigin(request);
  if (!origin) return privateEmploymentJson({ error: { code: "forbidden" } }, 403);
  const body = await employmentRequestBody(request);
  const challenge = typeof body?.challenge_ref === "string" ? body.challenge_ref : "";
  const code = typeof body?.code === "string" ? body.code : "";
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(challenge) || !/^\d{6}$/.test(code)) return privateEmploymentJson({ error: { code: "invalid_request" } }, 422);
  try {
    const result = await verifyEmploymentCode(challenge, code, origin);
    await setEmploymentToken(result.token);
    return privateEmploymentJson({ authenticated: true, user: result.session });
  } catch (error) { return employmentError(error); }
}
