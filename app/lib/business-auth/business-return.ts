/** Compatibility and sign-in destinations never establish authorization. */
export function safeBusinessModuleReturn(value: string | null): string | null {
 if(!value || value.length>700)return null;
 let url:URL;try{url=new URL(value,'https://return.invalid');}catch{return null;}
 if(url.origin!=='https://return.invalid'||url.hash||!/^\/businesses\/BUS_[A-Za-z0-9_-]+\/(wenze|employment|finance)$/.test(url.pathname))return null;
 const rules:Record<string,RegExp>={lang:/^(en|fr|ln|sw)$/,view:/^[a-z_-]{1,30}$/,store:/^WNZ_[A-Za-z0-9_-]+$/,product:/^WNP_[A-Za-z0-9_-]+$/,offer:/^JOB_[A-Za-z0-9_-]+$/,application:/^APP_[A-Za-z0-9_-]+$/};
 for(const [key,v] of url.searchParams)if(!rules[key]?.test(v)||url.searchParams.getAll(key).length!==1)return null;
 return url.pathname+url.search;
}
export function legacyWenzeDestination(search:URLSearchParams,selected?:string|null):string|null{
 if(search.getAll('context').length>1)return null;
 const ref=search.get('context')??selected;
 if(!ref||!/^BUS_[A-Za-z0-9_-]+$/.test(ref))return null;
 const query=new URLSearchParams(search);query.delete('context');
 return safeBusinessModuleReturn(`/businesses/${ref}/wenze${query.size?'?'+query:''}`);
}
