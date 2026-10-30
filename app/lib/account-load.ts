/** Bounded private reads. A failed request is never an empty account. */
export class AccountLoadError extends Error {
 constructor(public status:number){super('account_unavailable');}
}
export async function readAccount(path:string,binding:string,signal:AbortSignal){
 const response=await fetch(`/api/shida/personal/security/${path}`,{cache:'no-store',
  headers:{'x-shida-session':binding},signal:AbortSignal.any([signal,AbortSignal.timeout(12000)])});
 if(!response.ok)throw new AccountLoadError(response.status);
 return response.json();
}
