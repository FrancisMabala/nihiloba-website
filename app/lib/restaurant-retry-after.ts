/** Parse Retry-After without turning malformed headers into automatic retries. */
export function retryAfterMilliseconds(value:string|null,now=Date.now()):number|undefined{
 if(!value?.trim())return undefined;
 const text=value.trim();
 const delay=/^\d+$/.test(text)?Number(text)*1000:Date.parse(text)-now;
 if(!Number.isFinite(delay))return undefined;
 return Math.max(0,Math.min(delay,Number.MAX_SAFE_INTEGER-now));
}
