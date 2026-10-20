import {cookies} from "next/headers";
import {confirmCommerceWeb} from "../../../../services/shida/commerce-client";
import {personalRequestOrigin} from "../../../../lib/personal-request-origin";
import {PERSONAL_SESSION_COOKIE,personalSessionBinding} from "../../employment/route-utils";
import {cartToken,commerceError,privateJson,requestObject} from "../route-utils";
export async function POST(request:Request){
 const origin=personalRequestOrigin(request);
 if(!origin||request.headers.get("sec-fetch-site")==="cross-site")return privateJson({error:{code:"forbidden"}},403);
 const session=(await cookies()).get(PERSONAL_SESSION_COOKIE)?.value;
 if(!session||!/^[A-Za-z0-9_-]{20,256}$/.test(session)||request.headers.get("X-Shida-Session")!==personalSessionBinding(session))return privateJson({error:{code:"forbidden"}},401);
 const token=await cartToken();if(!token)return privateJson({error:{code:"cart_not_found"}},404);
 const body=await requestObject(request);
 if(!body||Object.keys(body).length!==1||typeof body.idempotency_key!=="string"||! /^[A-Za-z0-9_-]{8,120}$/.test(body.idempotency_key))return privateJson({error:{code:"validation_error"}},422);
 try{return privateJson(await confirmCommerceWeb(token,session,origin,body.idempotency_key),201);}
 catch(error){return commerceError(error);}
}
