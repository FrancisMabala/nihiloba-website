type Work={signal:AbortSignal;run:()=>Promise<unknown>;resolve:(value:unknown)=>void;reject:(reason:unknown)=>void;cancel:()=>void};
type Queue={active:number;waiting:Work[]};
// Only outstanding work is retained. Different authenticated bindings never
// share work or results; completed queues are removed, not cached.
const queues=new Map<string,Queue>();
export function servicesOverviewRead<T>(binding:string,signal:AbortSignal,run:()=>Promise<T>):Promise<T>{
 const key=binding;
 const queue=queues.get(key)??{active:0,waiting:[]};queues.set(key,queue);
 const obsolete=()=>new DOMException('Obsolete overview read','AbortError');
 const release=()=>{if(!queue.active&&!queue.waiting.length&&queues.get(key)===queue)queues.delete(key);};
 function drain(){
  while(queue.active<2&&queue.waiting.length){
   const work=queue.waiting.shift()!;work.signal.removeEventListener('abort',work.cancel);
   if(work.signal.aborted){work.reject(obsolete());continue;}
   queue.active++;
   Promise.resolve().then(()=>{if(work.signal.aborted)throw obsolete();return work.run();})
    .then(value=>work.signal.aborted?work.reject(obsolete()):work.resolve(value),work.reject)
    .finally(()=>{queue.active--;drain();release();});
  }
  release();
 }
 return new Promise<T>((resolve,reject)=>{
  if(signal.aborted){reject(obsolete());release();return;}
  const work:Work={signal,run,resolve:value=>resolve(value as T),reject,cancel:()=>{
   const index=queue.waiting.indexOf(work);if(index>=0){queue.waiting.splice(index,1);reject(obsolete());release();}
  }};
  queue.waiting.push(work);signal.addEventListener('abort',work.cancel,{once:true});drain();
 });
}
