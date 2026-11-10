import {it,expect,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {SpaceSidebar} from '../app/components/shida/space-sidebar';
import {JobSearchSpace} from '../app/components/shida/job-search-space';
import {jobSearchCopy,jobSearchPath,jobSearchSections} from '../app/lib/job-search-copy';
import {resolveSpaceView} from '../app/lib/space-view';
import {jobSearchRequest,JobSearchError} from '../app/lib/job-search-api';
for(const locale of ['fr','en','ln','sw'] as const){
 it(`provides all six real destinations in ${locale} and preserves legacy profiles`,()=>{
  const html=renderToStaticMarkup(<JobSearchSpace locale={locale} binding={'a'.repeat(64)} onUnauthorized={()=>{}}/>);
  for(const key of jobSearchSections){expect(html).toContain(jobSearchCopy[locale][key]);expect(html).toContain(jobSearchPath(locale,key).replaceAll('&','&amp;'));}
  const sidebar=renderToStaticMarkup(<SpaceSidebar locale={locale} view="job-search"/>);
  expect(sidebar).toContain(jobSearchCopy[locale].title);expect(sidebar).toContain('aria-current="page"');
  expect(resolveSpaceView('candidate')).toBe('candidate');expect(resolveSpaceView('job-search')).toBe('job-search');
 });
 it(`keeps external clicks distinct from SHIDA submissions in ${locale}`,()=>{
  const html=renderToStaticMarkup(<JobSearchSpace locale={locale} binding={'a'.repeat(64)} initialSection="applications" onUnauthorized={()=>{}}/>);
  expect(html).toContain(jobSearchCopy[locale].externalGap);expect(html).toContain(jobSearchCopy[locale].directApplications);
 });
}
it('uses persisted authenticated API state and rejects a replaced session',async()=>{
 const fetcher=vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({saved:true})).mockResolvedValueOnce(Response.json({}, {status:401}));
 vi.stubGlobal('fetch',fetcher);
 try{
  expect(await jobSearchRequest('bound-session','fr','jobs/JOB_test','PUT',{action:'save',enabled:true})).toEqual({saved:true});
  expect(fetcher.mock.calls[0][1]).toMatchObject({credentials:'same-origin',cache:'no-store',headers:{'X-Shida-Session':'bound-session'}});
  await expect(jobSearchRequest('old-session','fr','saved')).rejects.toBeInstanceOf(JobSearchError);
 }finally{vi.unstubAllGlobals();}
});
