import {lazy, type ComponentType, type LazyExoticComponent} from 'react';
// Matches React.lazy's generic component constraint; concrete props stay inferred.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RestaurantPanelComponent = ComponentType<any>;

/** Only asset-loading failures are recoverable here. Module evaluation and
 * component rendering defects must still reach the framework error handling. */
export function isPanelAssetError(error:unknown):boolean {
 if(!error || typeof error!=='object')return false;
 const {name,message,code}=error as {name?:unknown;message?:unknown;code?:unknown};
 return (name==='ChunkLoadError' && typeof message==='string' && /loading .*chunk|failed to load chunk/i.test(message))
  || code==='CSS_CHUNK_LOAD_FAILED'
  || (typeof message==='string' && /^Failed to load chunk .+ from module /i.test(message));
}

export class RestaurantPanelDownloadError extends Error {
 constructor(cause:unknown){super('Restaurant panel download failed',{cause});this.name='RestaurantPanelDownloadError';}
}

export function createRestaurantPanelLoader<T extends RestaurantPanelComponent>(load:()=>Promise<{default:T}>) {
 type Attempt={failed:boolean;load:()=>Promise<{default:T}>;Component:LazyExoticComponent<T>};
 function attempt():Attempt{
  let promise:ReturnType<typeof load>|undefined;
  const value:Attempt={
   failed:false,
   load(){
    // One promise per attempt: concurrent renders neither duplicate downloads
    // nor retry automatically. Successful modules and component identity survive.
    return promise??=load().catch(error=>{
     if(!isPanelAssetError(error))throw error;
     value.failed=true;
     throw new RestaurantPanelDownloadError(error);
    });
   },
   Component:lazy(()=>value.load()),
  };
  return value;
 }
 let current=attempt();
 return {
  current:()=>current,
  retry(failed:ReturnType<typeof attempt>){
   // React.lazy caches rejections. Replace only the failed lazy type, never the
   // workspace or another loaded panel. A second mounted consumer shares it.
   if(current===failed && failed.failed)current=attempt();
   return current;
  },
 };
}
