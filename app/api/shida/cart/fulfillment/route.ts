import {setCommerceFulfillment} from "../../../../services/shida/commerce-client";
import {assertSameOrigin,cartToken,commerceError,privateJson,requestObject,validReference} from "../route-utils";
export async function PUT(request:Request){
 const rejected=assertSameOrigin(request);if(rejected)return rejected;
 const token=await cartToken();if(!token)return privateJson({error:{code:"cart_not_found"}},404);
 const body=await requestObject(request);
 if(!body||!validReference(body.store_reference)||!["pickup","delivery"].includes(String(body.method)))return privateJson({error:{code:"validation_error"}},422);
 const {store_reference,...fields}=body;
 if(Object.keys(fields).some(key=>!["method","expected_version","city","commune","quartier","area","landmark","address","instructions"].includes(key)))return privateJson({error:{code:"validation_error"}},422);
 try{return privateJson({cart:await setCommerceFulfillment(token,store_reference,fields)});}
 catch(error){return commerceError(error);}
}
