/** Only product/variant codes enter shop-scoped lookup; QR links grant no access. */
export function wenzeScanCode(raw:string):string|null{
 const text=raw.trim();
 const code=/^(WNP_|WNV_)[A-Za-z0-9_-]{3,64}$/;
 if(code.test(text))return text;
 if(/^INV-[A-Za-z0-9_-]{3,64}$/.test(text))return text;
 try{
  const url=new URL(text);
  if(url.protocol!=="https:"||!["nihiloba.com","www.nihiloba.com"].includes(url.hostname)||url.username||url.password)return null;
  const match=url.pathname.match(/^\/(?:en\/|fr\/|ln\/|sw\/)?shida\/wenze\/(?:products|produits)\/([^/]+)\/?$/);
  return match&&code.test(match[1])?match[1]:null;
 }catch{return null;}
}
