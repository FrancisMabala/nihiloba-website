import { getCandidateApplicationPage } from "../../../../services/shida/employment-client";
import { employmentError, employmentToken, privateEmploymentJson } from "../route-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = await employmentToken();
  if (!token) return privateEmploymentJson({ error: { code: "unauthorized" } }, 401);
  const raw=new URL(request.url).searchParams.get('page')??'1';
  if(!/^[1-9]\d{0,5}$/.test(raw))return privateEmploymentJson({error:{code:'invalid_page'}},400);
  try { return privateEmploymentJson(await getCandidateApplicationPage(token,Number(raw))); }
  catch (error) { return employmentError(error); }
}
