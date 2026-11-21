/** A Today workspace owns two read slots across store/locale/refresh changes.
 * Cancelling a generation removes queued work. Already sent reads retain their
 * slot until settled: cancelling a browser consumer cannot prove server abort.
 */
export function createWenzeTodayReads(request:(path:string)=>Promise<unknown>){
 type Job={path:string;signal:AbortSignal;resolve:(value:unknown)=>void;reject:(reason:unknown)=>void;cancel:()=>void};
 const queue:Job[]=[];
 let active=0;
 const cancelled=()=>new DOMException('Obsolete Today read','AbortError');
 function drain(){
  while(active<2&&queue.length){
   const job=queue.shift()!;
   job.signal.removeEventListener('abort',job.cancel);
   if(job.signal.aborted){job.reject(cancelled());continue;}
   active++;
   Promise.resolve().then(()=>{
    if(job.signal.aborted)throw cancelled();
    return request(job.path);
   }).then(value=>job.signal.aborted?job.reject(cancelled()):job.resolve(value),job.reject)
    .finally(()=>{active--;drain();});
  }
 }
 return (path:string,signal:AbortSignal)=>new Promise<unknown>((resolve,reject)=>{
  if(signal.aborted){reject(cancelled());return;}
  const job:Job={path,signal,resolve,reject,cancel:()=>{
   const index=queue.indexOf(job);
   if(index>=0){queue.splice(index,1);signal.removeEventListener('abort',job.cancel);reject(cancelled());}
  }};
  queue.push(job);signal.addEventListener('abort',job.cancel,{once:true});drain();
 });
}

// Store navigation remounts Today. Keep its read slots for the existing API
// binding, not the component lifetime. No responses or identity data are cached.
const bindingReads=new WeakMap<(path:string)=>Promise<unknown>,ReturnType<typeof createWenzeTodayReads>>();
export function wenzeTodayReads(request:(path:string)=>Promise<unknown>){
 let reads=bindingReads.get(request);
 if(!reads){reads=createWenzeTodayReads(request);bindingReads.set(request,reads);}
 return reads;
}
