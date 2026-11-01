import {afterEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {compensationPeriod,JobCategories,JobPostingEntry} from '../app/components/shida/job-discovery-ui';
import {getJobs,parseJobSearchParams} from '../app/services/shida/public-client';
import {JobsDiscoveryHero,JobsInvitations,jobsFinalCopy} from '../app/components/shida/jobs-discovery-final';
import {JOBS_SLOGAN} from '../app/lib/brand';
afterEach(()=>vi.unstubAllGlobals());
it('keeps the brand in Lingala and uses distinct existing invitation destinations in every locale',()=>{
 for(const locale of ['en','fr','ln','sw'] as const){
  const hero=renderToStaticMarkup(<JobsDiscoveryHero locale={locale}/>),invites=renderToStaticMarkup(<JobsInvitations locale={locale}/>);
  expect(hero).toContain(`lang="ln">${JOBS_SLOGAN}`);expect(hero).toContain(jobsFinalCopy[locale].intro);expect(hero).not.toContain('<a');
  expect(invites).toContain(encodeURIComponent(jobsFinalCopy[locale].candidateCommand).replace(/%20/g,'+'));expect(invites).toContain(encodeURIComponent(jobsFinalCopy[locale].personalCommand).replace(/%20/g,'+'));
  expect(invites).toContain('https://business.nihiloba.com/');expect(invites).toContain(locale==='fr'?'/fr/shida/mes-candidatures':'/shida/my-applications');expect(invites).not.toContain('/register');
 }
});
it('preserves exact compensation units, including unknown historical units',()=>{
 expect(compensationPeriod('month','fr')).toBe('mois');expect(compensationPeriod('day','fr')).toBe('jour');expect(compensationPeriod('intervention','fr')).toBe('intervention');
 expect(compensationPeriod('per completed assignment','sw')).toBe('per completed assignment');
});
it('passes combined employer/category filters to the server with pagination',async()=>{
 const fetch=vi.fn().mockResolvedValue(Response.json({items:[],pagination:{page:2,page_size:1,total_items:0,total_pages:0}}));vi.stubGlobal('fetch',fetch);
 const search=parseJobSearchParams({view:'individual',category:'education_training',city:'Kinshasa',page:'2',page_size:'1'});await getJobs(search,'ln');
 const url=new URL(fetch.mock.calls[0][0]);expect(Object.fromEntries(url.searchParams)).toMatchObject({view:'individual',category:'education_training',city:'Kinshasa',page:'2',page_size:'1',language:'ln'});
});
it('category changes reset pagination and preserve the other filters',()=>{
 const html=renderToStaticMarkup(<JobCategories locale="fr" search={{view:'professional',city:'Kinshasa',page:4}} categories={[{id:'education_training',label:'Éducation'}]}/>);
 expect(html).toContain('city=Kinshasa&amp;category=education_training&amp;view=professional&amp;page=1');expect(html).not.toContain('page=4');expect(html).toContain('Éducation');
});
it('posting reuses existing Personal and Business workflows in all four languages',()=>{
 for(const locale of ['en','fr','ln','sw'] as const){const html=renderToStaticMarkup(<JobPostingEntry locale={locale}/>);expect(html).toContain('https://business.nihiloba.com/');expect(html).toContain('https://wa.me/');expect(html).not.toContain('/register');}
});
