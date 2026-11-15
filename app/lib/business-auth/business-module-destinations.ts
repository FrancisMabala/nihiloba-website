// Existing operational views only. Shared by school ordering and safe sign-in
// returns; API permissions still authorize every resource after navigation.
export const schoolSections=['setup','academic','students','staff','guardians','communications','imports','fees','fee-summary','payments','finance-controls','inventory','public-profile'] as const;
export const restaurantViews=['today','orders','pos','counter','kitchen','tables','inventory','daily','paymentMethods','recovery','reservations','items','categories','offerings','privateMenu','profile','hours','intake','reviews','activity','preview','team','routing','service','batch'] as const;

export function safeResourceModuleReturn(value:string|null):string|null{
  if(!value||value.length>700)return null;
  let url:URL;try{url=new URL(value,'https://return.invalid');}catch{return null;}
  if(url.origin!=='https://return.invalid')return null;
  const match=/^\/businesses\/BUS_[A-Za-z0-9_-]+\/(restaurants|schools)$/.exec(url.pathname);
  if(!match)return null;
  const school=match[1]==='schools';
  if(url.hash&&(!school||!schoolSections.some(section=>url.hash===`#school-${section}`)))return null;
  for(const [key,value] of url.searchParams){
    if(url.searchParams.getAll(key).length!==1)return null;
    const valid=key==='lang'?/^(en|fr|ln|sw)$/.test(value):school?key==='school'&&/^SCH_[A-Za-z0-9_-]+$/.test(value):key==='establishment'?/^RST_[A-Za-z0-9_-]+$/.test(value):key==='view'&&restaurantViews.some(view=>view===value);
    if(!valid)return null;
  }
  return url.pathname+url.search+url.hash;
}
