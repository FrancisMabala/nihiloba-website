function decode(value:string):Uint8Array<ArrayBuffer>{const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
function encode(value:ArrayBuffer){return btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
type Descriptor={id:string;type:'public-key';transports?:AuthenticatorTransport[]};
export async function passkeyCeremony(options:Record<string,unknown>,register:boolean){
 if(!window.PublicKeyCredential||!navigator.credentials)throw new Error('passkey_unavailable');
 const descriptors=(value:unknown)=>(value as Descriptor[]|undefined)?.map(item=>({...item,id:decode(item.id)}));
 let credential:Credential|null;
 if(register){
  const user=options.user as {id:string;name:string;displayName:string};
  credential=await navigator.credentials.create({publicKey:{...options,rp:options.rp as PublicKeyCredentialRpEntity,pubKeyCredParams:options.pubKeyCredParams as PublicKeyCredentialParameters[],challenge:decode(options.challenge as string),user:{...user,id:decode(user.id)},excludeCredentials:descriptors(options.excludeCredentials)}});
 }else{
  credential=await navigator.credentials.get({publicKey:{...options,challenge:decode(options.challenge as string),allowCredentials:descriptors(options.allowCredentials)} as PublicKeyCredentialRequestOptions});
 }
 if(!credential)throw new Error('passkey_cancelled');
 const key=credential as PublicKeyCredential;
 const result:{id:string;rawId:string;type:string;response:Record<string,unknown>;clientExtensionResults:AuthenticationExtensionsClientOutputs}={id:key.id,rawId:encode(key.rawId),type:key.type,response:{clientDataJSON:encode(key.response.clientDataJSON)},clientExtensionResults:key.getClientExtensionResults()};
 if(register){const response=key.response as AuthenticatorAttestationResponse;result.response.attestationObject=encode(response.attestationObject);result.response.transports=response.getTransports?.()??[];}
 else{const response=key.response as AuthenticatorAssertionResponse;result.response.authenticatorData=encode(response.authenticatorData);result.response.signature=encode(response.signature);result.response.userHandle=response.userHandle?encode(response.userHandle):null;}
 return result;
}
