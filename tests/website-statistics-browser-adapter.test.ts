import {afterEach,it,expect,vi} from 'vitest';
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
function storage(){const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k),key:(i:number)=>[...values.keys()][i]??null,get length(){return values.size;}};}
it('uses credential-free, privacy-limited requests only after acceptance and aborts on revocation',async()=>{
 vi.resetModules();const local=storage(),session=storage();let id=0;
 vi.stubGlobal('crypto',{randomUUID:()=>`00000000-0000-4000-8000-${String(++id).padStart(12,'0')}`});vi.stubGlobal('window',{localStorage:local,sessionStorage:session,crypto:globalThis.crypto});vi.stubGlobal('navigator',{doNotTrack:'0',globalPrivacyControl:false});const fetcher=vi.fn().mockImplementation(()=>new Promise(()=>{}));vi.stubGlobal('fetch',fetcher);
 const {websiteStatistics,statisticsDimensions}=await import('../app/lib/website-statistics-consent');const stats=websiteStatistics()!,dims=statisticsDimensions('/shida','en','desktop','','https://nihiloba.com');stats.observe(dims).tick(true,true);await Promise.resolve();expect(fetcher).not.toHaveBeenCalled();expect(id).toBe(0);
 stats.job('JOB_fixture','view');stats.job('JOB_fixture','share');
 await Promise.resolve();expect(session.length).toBe(0);expect(fetcher).not.toHaveBeenCalled();
 stats.choose('accepted');stats.observe(dims).tick(true,true);stats.employer('ORGDIR_fixture');stats.job('JOB_fixture','view');stats.job('JOB_fixture','view');stats.job('JOB_fixture','share');
 await Promise.resolve();expect(fetcher).toHaveBeenCalledTimes(4);
 expect(fetcher.mock.calls.slice(2).map(([url])=>url)).toEqual(['/api/shida/public-jobs/JOB_fixture/view','/api/shida/public-jobs/JOB_fixture/share']);
 expect(session.getItem('shida_job_viewed_JOB_fixture')).toBe('1');
 stats.job('JOB_pending','view');
 for(const [url,options] of fetcher.mock.calls){expect(options).toMatchObject({method:'POST',credentials:'omit',cache:'no-store',referrerPolicy:url.includes('/public-jobs/')?'origin':'no-referrer'});expect(options.headers??{}).not.toHaveProperty('Cookie');expect(options.headers??{}).not.toHaveProperty('X-Shida-Session');}
 expect(fetcher.mock.calls[0][0]).toBe('/api/shida/statistics/');stats.choose('declined');expect(fetcher.mock.calls.every(([,options])=>options.signal.aborted)).toBe(true);
 await Promise.resolve();expect(fetcher).toHaveBeenCalledTimes(4);expect(session.length).toBe(0);
});
it.each([{doNotTrack:'1',globalPrivacyControl:false},{doNotTrack:'0',globalPrivacyControl:true}])('prevents IDs and requests for browser privacy settings %j',async flags=>{
 vi.resetModules();const local=storage(),session=storage(),uuid=vi.fn();vi.stubGlobal('crypto',{randomUUID:uuid});vi.stubGlobal('window',{localStorage:local,sessionStorage:session,crypto:globalThis.crypto});vi.stubGlobal('navigator',flags);const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 const {websiteStatistics}=await import('../app/lib/website-statistics-consent');const stats=websiteStatistics()!;stats.choose('accepted');stats.employer('ORGDIR_fixture');stats.job('JOB_fixture','view');expect(stats.consent()).toBe('blocked');expect(uuid).not.toHaveBeenCalled();expect(fetcher).not.toHaveBeenCalled();expect(local.length).toBe(0);
});
