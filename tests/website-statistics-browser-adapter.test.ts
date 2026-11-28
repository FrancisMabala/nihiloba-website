import {afterEach,it,expect,vi} from 'vitest';
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
function storage(){const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k),key:(i:number)=>[...values.keys()][i]??null,get length(){return values.size;}};}
it('ignores a stored acceptance, clears only optional markers and sends no measurements',async()=>{
 const local=storage(),session=storage(),uuid=vi.fn(),fetcher=vi.fn();
 vi.stubGlobal('crypto',{randomUUID:uuid});vi.stubGlobal('window',{localStorage:local,sessionStorage:session,crypto:globalThis.crypto});
 vi.stubGlobal('navigator',{doNotTrack:'0',globalPrivacyControl:false});vi.stubGlobal('fetch',fetcher);
 const {websiteStatistics,statisticsDimensions,STATISTICS_CHOICE_KEY,STATISTICS_VISITOR_KEY,STATISTICS_SESSION_KEY}=await import('../app/lib/website-statistics-consent');
 const stored=JSON.stringify({choice:'accepted',expires:Date.now()+86400000});
 local.setItem(STATISTICS_CHOICE_KEY,stored);
 local.setItem(STATISTICS_VISITOR_KEY,'stale visitor');
 local.setItem('functional_cart','cart');
 session.setItem(STATISTICS_SESSION_KEY,'stale session');
 session.setItem('shida_employer_visit_ORGDIR_fixture','stale employer marker');
 session.setItem('shida_job_viewed_JOB_fixture','stale job marker');
 session.setItem('functional_session','session');
 const stats=websiteStatistics()!;
 expect(stats.consent()).toBe('blocked');
 stats.refresh();
 stats.choose('accepted');
 stats.observe(statisticsDimensions('/shida','en','desktop','','https://nihiloba.com')).tick(true,true);
 stats.employer('ORGDIR_fixture');
 await Promise.resolve();
 expect(fetcher).not.toHaveBeenCalled();expect(uuid).not.toHaveBeenCalled();
 expect(local.getItem(STATISTICS_CHOICE_KEY)).toBe(stored);
 expect(local.getItem(STATISTICS_VISITOR_KEY)).toBeNull();
 expect(local.getItem('functional_cart')).toBe('cart');
 expect(session.length).toBe(1);expect(session.getItem('functional_session')).toBe('session');
});
it.each([{doNotTrack:'1',globalPrivacyControl:false},{doNotTrack:'0',globalPrivacyControl:true}])('prevents IDs and requests for browser privacy settings %j',async flags=>{
 vi.resetModules();const local=storage(),session=storage(),uuid=vi.fn();vi.stubGlobal('crypto',{randomUUID:uuid});vi.stubGlobal('window',{localStorage:local,sessionStorage:session,crypto:globalThis.crypto});vi.stubGlobal('navigator',flags);const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 const {websiteStatistics}=await import('../app/lib/website-statistics-consent');const stats=websiteStatistics()!;stats.choose('accepted');stats.employer('ORGDIR_fixture');expect(stats.consent()).toBe('blocked');expect(uuid).not.toHaveBeenCalled();expect(fetcher).not.toHaveBeenCalled();expect(local.length).toBe(0);
});
