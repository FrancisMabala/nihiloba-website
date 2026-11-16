import { cookies } from "next/headers";
import { getEmploymentSession } from "../../../services/shida/employment-client";
import { TEST_MARKETPLACE_COOKIE, TEST_MARKETPLACE_MODE } from "../../../lib/test-marketplace";
import { assertEmploymentSameOrigin, employmentToken, employmentError, personalSessionBinding, privateEmploymentJson } from "../employment/route-utils";

export async function POST(request: Request) {
  const denied = assertEmploymentSameOrigin(request); if (denied) return denied;
  let enabled: unknown;
  try {
    if(!request.headers.get('content-type')?.startsWith('application/json')||!request.body)throw Error();
    const reader=request.body.getReader();let text='';let size=0;
    try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>128){await reader.cancel();throw Error();}text+=new TextDecoder().decode(value);}}
    finally {reader.releaseLock();}
    const body = JSON.parse(text); if (!body||Object.keys(body).length !== 1) throw Error(); enabled = body.enabled;
  }
  catch { return privateEmploymentJson({error:{code:"invalid_input"}}, 422); }
  if (typeof enabled !== "boolean") return privateEmploymentJson({error:{code:"invalid_input"}}, 422);
  const jar = await cookies();
  if (enabled) {
    const token = await employmentToken();
    if (!token || !/^[A-Za-z0-9_-]{20,256}$/.test(token) || request.headers.get("x-shida-session") !== personalSessionBinding(token)) return privateEmploymentJson({error:{code:"unauthorized"}}, 401);
    try {
      const user = await getEmploymentSession(token);
      if (!user.test_data) return privateEmploymentJson({error:{code:"forbidden"}}, 403);
    } catch (error) { return employmentError(error); }
    // Same canonical session, never a new privilege or permanent browser grant.
    // Only explicit test mode makes it available to server-rendered discovery.
    jar.set(TEST_MARKETPLACE_COOKIE, token, {httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:3600});
    jar.set(TEST_MARKETPLACE_MODE, "1", {secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:3600});
  } else {
    jar.set(TEST_MARKETPLACE_COOKIE, "", {httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:0});
    jar.set(TEST_MARKETPLACE_MODE, "", {secure:process.env.NODE_ENV === "production", sameSite:"strict", path:"/", maxAge:0});
  }
  return privateEmploymentJson({enabled});
}
