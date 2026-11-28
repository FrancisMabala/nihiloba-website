import {describe,it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {WebsiteStatistics,statisticsDimensions,STATISTICS_CHOICE_POLICY,STATISTICS_CHOICE_KEY,STATISTICS_VISITOR_KEY,STATISTICS_SESSION_KEY,statisticsCopy,type StatisticsEnvironment} from '../app/lib/website-statistics-consent';
vi.mock('next/navigation',()=>({usePathname:()=>'/shida'}));
import {WebsiteStatisticsConsent} from '../app/components/shida/website-statistics-consent';
function store(){const values=new Map<string,string>();return {values,getItem:(k:string)=>values.get(k)??null,setItem:vi.fn((k:string,v:string)=>{values.set(k,v);}),removeItem:(k:string)=>{values.delete(k);},key:(i:number)=>[...values.keys()][i]??null,get length(){return values.size;}};}
function fixture(){
 let time=1800000000000,sequence=0,blocked=false;const local=store(),session=store(),send=vi.fn<StatisticsEnvironment['send']>().mockResolvedValue(undefined),sendEmployer=vi.fn<StatisticsEnvironment['sendEmployer']>().mockResolvedValue(undefined);
 const uuid=vi.fn(()=>`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`);
 const env:StatisticsEnvironment={now:()=>time,uuid,blocked:()=>blocked,local:()=>local,session:()=>session,send,sendEmployer};
 return {stats:new WebsiteStatistics(env),env,local,session,send,sendEmployer,uuid,advance:(ms:number)=>{time+=ms;},block:()=>{blocked=true;}};
}
const dimensions=statisticsDimensions('/fr/shida/emplois/JOB_secret?token=private','fr','Mozilla Android Mobile Chrome/123','https://google.com/search?q=secret','https://nihiloba.com');
const settle=async()=>{await Promise.resolve();await Promise.resolve();};
describe('optional statistics privacy boundary',()=>{
 it.each([false,true])('cancels an old share when a suspended tab misses remote refusal/reacceptance (queued=%s)',async queued=>{
  const f=fixture(),sendJob=vi.fn().mockResolvedValue(undefined);f.env.sendJob=sendJob;
  const other=new WebsiteStatistics({...f.env,session:()=>store()});
  f.stats.choose('accepted');const complete=f.stats.prepareJobShare('JOB_shared');
  if(queued)complete?.();
  // Both changes occur at the same clock tick; no storage/focus event is delivered.
  other.choose('declined');other.choose('accepted');
  if(!queued)complete?.();
  await settle();expect(sendJob).not.toHaveBeenCalled();
  f.stats.prepareJobShare('JOB_shared')?.();await settle();
  expect(sendJob).toHaveBeenCalledExactlyOnceWith('JOB_shared','share',expect.any(AbortSignal));
 });
 it('creates no identifiers, measurement storage or requests before consent or after decline',async()=>{
  const f=fixture(),observer=f.stats.observe(dimensions);observer.tick(true,true);f.stats.employer('ORGDIR_test');await settle();
  expect(f.uuid).not.toHaveBeenCalled();expect(f.local.setItem).not.toHaveBeenCalled();expect(f.session.setItem).not.toHaveBeenCalled();expect(f.send).not.toHaveBeenCalled();expect(f.sendEmployer).not.toHaveBeenCalled();
  f.stats.choose('declined');observer.activity();observer.tick(true,true);f.stats.employer('ORGDIR_test');await settle();
  expect([...f.local.values.keys()]).toEqual([STATISTICS_CHOICE_KEY]);expect(f.session.length).toBe(0);expect(f.uuid).not.toHaveBeenCalled();expect(f.send).not.toHaveBeenCalled();
 });
 it('normalizes private paths, referrers and user agents locally to finite categories',()=>{
  expect(dimensions).toEqual({page_group:'employment',language:'fr',device:'phone',browser:'chrome',source:'search'});
  expect(JSON.stringify(dimensions)).not.toMatch(/secret|token|google|Mozilla/);
  expect(statisticsDimensions('/ln/shida/emplois/employeurs/ORGDIR_x','ln','Mozilla iPad Safari/1','https://nihiloba.com/private?token=x','https://nihiloba.com')).toMatchObject({page_group:'employer',device:'tablet',browser:'safari',source:'internal'});
  expect(statisticsDimensions('/anything/private','unknown','unknown','javascript:bad','https://nihiloba.com')).toMatchObject({page_group:'other',language:'other',source:'other'});
 });
 it('starts only on a visible focused observation and sends no account or URL fields',async()=>{
  const f=fixture();f.stats.choose('accepted');const observer=f.stats.observe(dimensions);observer.tick(false,false);observer.tick(true,false);await settle();expect(f.uuid).toHaveBeenCalledTimes(1); // Local consent grant only, no measurement IDs.
  observer.tick(true,true);await settle();expect(f.send).toHaveBeenCalledTimes(1);expect(f.send.mock.calls[0][0]).toEqual({...dimensions,consent:true,policy:'web-statistics-v1',visitor:expect.any(String),session:expect.any(String),visit:expect.any(String),active_seconds:0});
  expect(f.uuid).toHaveBeenCalledTimes(4);
 });
 it('sends cumulative active time with the same retry-safe page observation',async()=>{
  const f=fixture();f.stats.choose('accepted');const observer=f.stats.observe(dimensions);observer.tick(true,true);await settle();
  for(let i=0;i<6;i++){f.advance(5000);observer.tick(true,true);}await settle();
  expect(f.send.mock.calls[1][0].active_seconds).toBe(30);expect(f.send.mock.calls[1][0].visit).toBe(f.send.mock.calls[0][0].visit);
  observer.stop(true,true);await settle();expect(f.send.mock.calls.at(-1)?.[0].active_seconds).toBe(30);
 });
 it('excludes hidden, unfocused and idle time and caps delayed heartbeat accumulation',async()=>{
  const f=fixture();f.stats.choose('accepted');const observer=f.stats.observe(dimensions);observer.tick(true,true);f.advance(10000);observer.tick(false,false);await settle();expect(f.send.mock.calls.at(-1)?.[0].active_seconds).toBe(10);
  f.advance(300000);observer.tick(false,false);observer.tick(true,false);await settle();expect(f.send.mock.calls.at(-1)?.[0].active_seconds).toBe(10);
  expect(f.send).toHaveBeenCalledTimes(2);
  observer.activity();observer.tick(true,true);f.advance(180000);observer.tick(true,true);await settle();expect(f.send.mock.calls.at(-1)?.[0].active_seconds).toBe(40);
  f.advance(60000);observer.tick(true,true);await settle();expect(f.send.mock.calls.at(-1)?.[0].active_seconds).toBe(40);
 });
 it('does not generate new sessions on idle pages, but rotates after activity resumes',async()=>{
  const f=fixture();f.stats.choose('accepted');const observer=f.stats.observe(dimensions);observer.tick(true,true);await settle();const first=f.send.mock.calls[0][0];
  f.advance(31*60000);observer.tick(true,true);await settle();expect(f.uuid).toHaveBeenCalledTimes(4);
  observer.activity();observer.tick(true,true);await settle();const next=f.send.mock.calls.at(-1)![0];expect(next.session).not.toBe(first.session);expect(next.visit).not.toBe(first.visit);expect(next.visitor).toBe(first.visitor);expect(next.active_seconds).toBe(0);
 });
 it('does not extend visitor lifetime when sending subsequent measurements',async()=>{
  const f=fixture();f.stats.choose('accepted');f.stats.observe(dimensions).tick(true,true);await settle();const first=JSON.parse(f.local.values.get(STATISTICS_VISITOR_KEY)!);
  f.advance(29*86400000);f.stats.observe(dimensions).tick(true,true);await settle();expect(JSON.parse(f.local.values.get(STATISTICS_VISITOR_KEY)!)).toEqual(first);
  f.advance(2*86400000);f.stats.observe(dimensions).tick(true,true);await settle();expect(JSON.parse(f.local.values.get(STATISTICS_VISITOR_KEY)!).id).not.toBe(first.id);
 });
 it('revokes synchronously, aborts in-flight requests, clears analytics IDs and preserves unrelated storage',async()=>{
  const f=fixture();f.local.values.set('functional_cart','retain');f.session.values.set('functional_session','retain');f.stats.choose('accepted');const observer=f.stats.observe(dimensions);
  f.send.mockImplementation(()=>new Promise(()=>{}));f.sendEmployer.mockImplementation(()=>new Promise(()=>{}));observer.tick(true,true);f.stats.employer('ORGDIR_one');await settle();
  const signals=[f.send.mock.calls[0][1],f.sendEmployer.mock.calls[0][2]];f.stats.choose('declined');expect(signals.every(signal=>signal.aborted)).toBe(true);
  expect(f.local.values.has(STATISTICS_VISITOR_KEY)).toBe(false);expect(f.session.values.has(STATISTICS_SESSION_KEY)).toBe(false);expect([...f.session.values.keys()]).toEqual(['functional_session']);expect(f.local.values.get('functional_cart')).toBe('retain');
  f.advance(30000);observer.activity();observer.tick(true,true);f.stats.employer('ORGDIR_two');await settle();expect(f.send).toHaveBeenCalledTimes(1);expect(f.sendEmployer).toHaveBeenCalledTimes(1);
 });
 it('cancels queued sends before they start and never resurrects an old observer after reacceptance',async()=>{
  const f=fixture();f.stats.choose('accepted');const observer=f.stats.observe(dimensions);observer.tick(true,true);f.stats.choose('declined');await settle();expect(f.send).not.toHaveBeenCalled();
  f.stats.choose('accepted');observer.tick(true,true);await settle();expect(f.send).not.toHaveBeenCalled();f.stats.observe(dimensions).tick(true,true);await settle();expect(f.send).toHaveBeenCalledTimes(1);
 });
 it('reacts to a consent change from another tab and clears local session IDs',async()=>{
  const f=fixture();f.stats.choose('accepted');const observer=f.stats.observe(dimensions);f.send.mockImplementation(()=>new Promise(()=>{}));observer.tick(true,true);await settle();const signal=f.send.mock.calls[0][1];
  f.local.values.set(STATISTICS_CHOICE_KEY,JSON.stringify({choice:'declined',expires:f.env.now()+86400000}));f.stats.refresh();expect(signal.aborted).toBe(true);expect(f.session.values.has(STATISTICS_SESSION_KEY)).toBe(false);observer.tick(true,true);await settle();expect(f.send).toHaveBeenCalledTimes(1);
 });
 it('honors browser privacy signals even when an earlier stored preference accepted',async()=>{
  const f=fixture();f.stats.choose('accepted');const observer=f.stats.observe(dimensions);observer.tick(true,true);await settle();f.block();observer.tick(true,true);await settle();expect(f.stats.consent()).toBe('blocked');expect(f.local.values.has(STATISTICS_VISITOR_KEY)).toBe(false);expect(f.send).toHaveBeenCalledTimes(1);
  const second=fixture();second.block();second.stats.choose('accepted');second.stats.observe(dimensions).tick(true,true);expect(second.uuid).not.toHaveBeenCalled();expect(second.local.setItem).not.toHaveBeenCalled();
 });
 it('expires consent after 180 days and clears historical employer identifiers on decline',async()=>{
  const f=fixture();f.stats.choose('accepted');const observer=f.stats.observe(dimensions);observer.tick(true,true);await settle();f.advance(180*86400000+1);observer.tick(true,true);await settle();expect(f.stats.consent()).toBe('unknown');expect(f.local.values.has(STATISTICS_VISITOR_KEY)).toBe(false);
  f.session.values.set('shida_employer_visit_OLD','legacy');f.stats.choose('declined');expect(f.session.values.has('shida_employer_visit_OLD')).toBe(false);
 });
 it('uses separate employer-scoped sessions only after consent',async()=>{
  const f=fixture();f.stats.employer('ORGDIR_one');await settle();expect(f.uuid).not.toHaveBeenCalled();f.stats.choose('accepted');f.stats.employer('ORGDIR_one');f.stats.employer('ORGDIR_one');f.stats.employer('ORGDIR_two');await settle();
  const calls=f.sendEmployer.mock.calls;expect(calls).toHaveLength(3);expect(calls[0][1].visitor).toBe(calls[1][1].visitor);expect(calls[0][1].event).not.toBe(calls[1][1].event);expect(calls[0][1].visitor).not.toBe(calls[2][1].visitor);
 });
 it('works in memory when storage is unavailable and still revokes',async()=>{
  const f=fixture();f.env.local=()=>null;f.env.session=()=>null;const stats=new WebsiteStatistics(f.env);stats.choose('accepted');stats.observe(dimensions).tick(true,true);await settle();expect(f.send).toHaveBeenCalledTimes(1);stats.choose('declined');stats.observe(dimensions).tick(true,true);await settle();expect(f.send).toHaveBeenCalledTimes(1);
 });
 it.each([false,true])('honors withdrawal when setting storage fails (removal fails: %s)',async(removeFails)=>{
  const f=fixture();
  f.stats.choose('accepted');
  f.send.mockImplementation(()=>new Promise(()=>{}));
  f.stats.observe(dimensions).tick(true,true);
  await settle();
  f.session.values.set('shida_job_viewed_JOB_old','1');
  f.session.values.set('functional_session','retain');
  f.local.values.set('functional_cart','retain');
  const remove=f.local.removeItem;
  f.local.removeItem=key=>{
   if(removeFails&&key===STATISTICS_CHOICE_KEY)throw Error('storage denied');
   remove(key);
  };
  f.local.setItem.mockImplementation(()=>{throw Error('storage denied');});
  f.stats.choose('declined');
  expect(f.stats.consent()).toBe('declined');
  expect(f.send.mock.calls[0][1].aborted).toBe(true);
  expect(f.local.values.has(STATISTICS_VISITOR_KEY)).toBe(false);
  expect(f.local.values.get('functional_cart')).toBe('retain');
  expect([...f.session.values.keys()]).toEqual(['functional_session',STATISTICS_CHOICE_KEY]);
  expect(f.session.values.get('functional_session')).toBe('retain');
  const reloaded=new WebsiteStatistics(f.env);
  expect(reloaded.consent()).toBe('declined');
  reloaded.observe(dimensions).tick(true,true);
  f.stats.observe(dimensions).tick(true,true);
  await settle();
  expect(f.send).toHaveBeenCalledOnce();
 });
 it('an explicit later acceptance clears the same-tab refusal after storage recovers',()=>{
  const f=fixture();
  f.stats.choose('accepted');
  f.local.setItem.mockImplementationOnce(()=>{throw Error('storage denied');});
  f.stats.choose('declined');
  expect(f.session.values.has(STATISTICS_CHOICE_KEY)).toBe(true);
  const reloaded=new WebsiteStatistics(f.env);
  reloaded.choose('accepted');
  expect(f.session.values.has(STATISTICS_CHOICE_KEY)).toBe(false);
  expect(new WebsiteStatistics(f.env).consent()).toBe('accepted');
 });
 it('keeps refusal in memory if neither store permits writing it',()=>{
  const f=fixture();
  f.stats.choose('accepted');
  f.local.removeItem=()=>{throw Error('storage denied');};
  for(const storage of [f.local,f.session])storage.setItem.mockImplementation(()=>{throw Error('storage denied');});
  f.stats.choose('declined');
  expect(f.stats.consent()).toBe('declined');
  expect(new WebsiteStatistics(f.env).consent()).toBe('accepted');
 });
 it.each(['accepted','declined'] as const)('validates legacy %s against the current disclosure',async(previous)=>{
  const f=fixture();
  const expires=f.env.now()+86400000;
  f.local.values.set(STATISTICS_CHOICE_KEY,JSON.stringify({choice:previous,expires}));
  expect(f.stats.consent()).toBe(previous==='accepted'?'unknown':'declined');
  f.stats.observe(dimensions).tick(true,true);
  await settle();
  expect(f.send).not.toHaveBeenCalled();
  f.stats.choose('accepted');
  expect(JSON.parse(f.local.values.get(STATISTICS_CHOICE_KEY)!)).toMatchObject({choice:'accepted',policy:STATISTICS_CHOICE_POLICY});
  expect(new WebsiteStatistics(f.env).consent()).toBe('accepted');
 });
 it.each(['not JSON','null','true','{}','{"choice":"accepted","expires":"1800000000001"}','{"choice":"accepted","expires":1}','{"choice":"accepted","expires":9900000000000}'])('fails closed for an invalid historical choice %s',async(value)=>{
  const f=fixture();
  f.local.values.set(STATISTICS_CHOICE_KEY,value);
  f.session.values.set('shida_job_viewed_JOB_old','1');
  f.stats.refresh();
  expect(f.stats.consent()).toBe('unknown');
  expect(f.session.length).toBe(0);
  f.stats.observe(dimensions).tick(true,true);
  await settle();
  expect(f.send).not.toHaveBeenCalled();
 });
 it.each(['fr','en','ln','sw'] as const)('renders localized cookie preferences without a server-side notice in %s',language=>{
  const html=renderToStaticMarkup(<WebsiteStatisticsConsent language={language}/>);
  const t=statisticsCopy[language];
  for(const copy of [t.preferences,t.details,t.necessary,t.always,t.analytics,t.choiceHelp,t.accept,t.decline,t.save])expect(html).toContain(copy);
  expect(html).toContain(`href="/${language==='en'?'en':'fr'}/privacy"`);
  expect(html).toContain('<dialog');
  expect(html).toContain(`aria-label="${t.close}"`);
  expect(html).not.toMatch(/website-statistics-notice|aria-modal|autofocus|checked|disabled/);
  expect(Object.keys(t).sort()).toEqual(Object.keys(statisticsCopy.en).sort());
 });
});
