import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import type {ReactElement} from 'react';
import {WebsiteStatistics} from '../app/lib/website-statistics-consent';

const fixture=vi.hoisted(()=>({stats:null as WebsiteStatistics|null,sendJob:vi.fn(),effects:[] as (()=>void)[]}));
vi.mock('react',async importOriginal=>({
 ...await importOriginal<typeof import('react')>(),
 useEffect:(effect:()=>void)=>{fixture.effects.push(effect);},
 useState:(seed:unknown)=>[seed,vi.fn()],
}));
vi.mock('../app/lib/website-statistics-consent',async importOriginal=>({
 ...await importOriginal<typeof import('../app/lib/website-statistics-consent')>(),
 websiteStatistics:()=>fixture.stats,
}));
import {JobPublicActions,JobViewTracker} from '../app/components/shida/job-public-actions';

beforeEach(()=>{
 fixture.stats=new WebsiteStatistics({
  now:()=>1800000000000,uuid:()=>crypto.randomUUID(),blocked:()=>false,local:()=>null,session:()=>null,
  send:vi.fn(),sendEmployer:vi.fn(),sendJob:fixture.sendJob.mockResolvedValue(undefined),
 });
 vi.stubGlobal('window',{location:{origin:'https://example.test'}});
});
afterEach(()=>{fixture.sendJob.mockReset();fixture.effects=[];vi.unstubAllGlobals();});

const settle=async()=>{await Promise.resolve();await Promise.resolve();};
function clickShare(origin:'external'|'direct'){
 const actions=JobPublicActions({locale:'en',jobReference:'JOB_fixture',title:'Synthetic job',path:'/shida/emplois/JOB_fixture',origin});
 const children=actions.props.children as ReactElement<{onClick:()=>void}>[];
 children[1].props.onClick();
}

describe('external job consent integration',()=>{
 it('delegates view tracking to the shared consent controller without managing its own storage',async()=>{
  expect(renderToStaticMarkup(<JobViewTracker jobReference="JOB_fixture"/>)).toBe('');
  fixture.effects[0]();
  await settle();
  expect(fixture.sendJob).not.toHaveBeenCalled();
  fixture.stats!.choose('accepted');
  fixture.stats!.refresh();
  await settle();
  expect(fixture.sendJob).toHaveBeenCalledExactlyOnceWith('JOB_fixture','view',expect.any(AbortSignal));
 });

 it.each([['external','unknown'],['external','declined'],['external','accepted'],['direct','accepted']] as const)('shares a %s job with consent %s',async (origin,consent)=>{
  if(consent!=='unknown')fixture.stats!.choose(consent);
  const writeText=vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator',{clipboard:{writeText}});
  clickShare(origin);
  await settle();
  expect(writeText).toHaveBeenCalledExactlyOnceWith('https://example.test/shida/emplois/JOB_fixture');
  if(origin==='external'&&consent==='accepted')expect(fixture.sendJob).toHaveBeenCalledExactlyOnceWith('JOB_fixture','share',expect.any(AbortSignal));
  else expect(fixture.sendJob).not.toHaveBeenCalled();
 });

 it.each(['native','clipboard'] as const)('cancels deferred %s measurements after withdrawal and reacceptance',async(method)=>{
  let finish!:()=>void;
  const share=vi.fn().mockImplementationOnce(()=>new Promise<void>(resolve=>{finish=resolve;})).mockResolvedValue(undefined);
  vi.stubGlobal('navigator',method==='native'?{share}:{clipboard:{writeText:share}});
  fixture.stats!.choose('accepted');
  clickShare('external');
  expect(share).toHaveBeenCalledOnce();
  fixture.stats!.choose('declined');
  fixture.stats!.choose('accepted');
  finish();
  await settle();
  expect(fixture.sendJob).not.toHaveBeenCalled();
  clickShare('external');
  await settle();
  expect(fixture.sendJob).toHaveBeenCalledExactlyOnceWith('JOB_fixture','share',expect.any(AbortSignal));
 });
});
