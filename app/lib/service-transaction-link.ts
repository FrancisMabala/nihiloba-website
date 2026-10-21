/** Exact references are navigation hints; all reads are authorized by the backend. */
export function serviceTransactionLink(search: string): {kind: "requests" | "reservations"; ref: string; quoteRef?: string} | null {
  const query = new URLSearchParams(search);
  if (["request", "quote", "booking"].some(key => query.getAll(key).length > 1)) return null;
  const request = query.get("request"), quote = query.get("quote"), booking = query.get("booking");
  if (booking && !request && !quote && /^RSV_[A-Za-z0-9_-]{1,28}$/.test(booking)) return {kind: "reservations", ref: booking};
  if (!booking && request && /^SWR_[A-Za-z0-9_-]{1,28}$/.test(request) && (!quote || /^SQT_[A-Za-z0-9_-]{1,28}$/.test(quote))) {
    return {kind: "requests", ref: request, ...(quote ? {quoteRef: quote} : {})};
  }
  return null;
}

/** Retain only supported task hints when changing the management language. */
export function serviceLanguageQuery(search:string,offeringRef?:string|null):string{
 const source=new URLSearchParams(search),result=new URLSearchParams();
 const view=source.get("view");
 if(source.getAll("view").length===1&&view&&["overview","available","proposals","calendar","services","work","finance","reports","templates","settings"].includes(view))result.set("view",view);
 const offering=source.getAll("offering").length===1?source.get("offering"):offeringRef;
 if(offering&&/^SVC_[A-Za-z0-9_-]{1,28}$/.test(offering))result.set("offering",offering);
 const task=serviceTransactionLink(search);
 if(task?.kind==="reservations")result.set("booking",task.ref);
 if(task?.kind==="requests"){result.set("request",task.ref);if(task.quoteRef)result.set("quote",task.quoteRef);}
 const posted=source.get("request"),proposal=source.get("proposal");
 if(!task&&!source.has("booking")&&!source.has("quote")&&source.getAll("request").length<=1&&source.getAll("proposal").length<=1
   &&(!posted||/^SPR_[A-Za-z0-9_-]{1,28}$/.test(posted))&&(!proposal||/^SPF_[A-Za-z0-9_-]{1,28}$/.test(proposal))){
  if(posted)result.set("request",posted);
  if(proposal)result.set("proposal",proposal);
 }
 return result.size?"?"+result.toString():"";
}
