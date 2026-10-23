import {afterEach,describe,expect,it,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {listPublicSchools,getPublicSchool} from '../app/services/shida/schools';
import {SchoolEntry} from '../app/components/shida/school-entry';
import {SchoolDetail} from '../app/components/shida/school-detail';

const school={school_ref:'SCH_ABC12345',name:'Synthetic Kindergarten',school_type_label:'Kindergarten',city:'Kinshasa',commune:'Gombe',description:'Public description',verification_label:'School identity and authority reviewed by SHIDA'};
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});

describe('reviewed School pages',()=>{
  it('reads only the public projection without caching',async()=>{
    const fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({items:[school],next_page:null})))
      .mockResolvedValueOnce(new Response(JSON.stringify(school)));
    vi.stubGlobal('fetch',fetchMock);
    expect(await listPublicSchools('en')).toEqual({kind:'ready',items:[school],nextPage:null});
    expect(await getPublicSchool(school.school_ref,'en')).toEqual({kind:'found',school});
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.nihiloba.com/api/public/education/schools?locale=en&page=1');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({cache:'no-store'});
  });
  it('rejects extra private data and separates missing from outage',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({items:[{...school,guardian_phone:'private'}],next_page:null})))
      .mockResolvedValueOnce(new Response('{}',{status:404}))
      .mockResolvedValueOnce(new Response('{}',{status:503})));
    expect(await listPublicSchools('fr')).toEqual({kind:'unavailable'});
    expect(await getPublicSchool(school.school_ref,'fr')).toEqual({kind:'missing'});
    expect(await getPublicSchool(school.school_ref,'fr')).toEqual({kind:'unavailable'});
    expect(await getPublicSchool('../unsafe','fr')).toEqual({kind:'missing'});
  });
  it('renders approved fields and an accurate unavailable state',()=>{
    const listing=renderToStaticMarkup(createElement(SchoolEntry,{locale:'en',listing:{kind:'ready',items:[school],nextPage:null}}));
    expect(listing).toContain('Synthetic Kindergarten');expect(listing).toContain('/shida/ecole/SCH_ABC12345');
    const detail=renderToStaticMarkup(createElement(SchoolDetail,{locale:'en',result:{kind:'found',school}}));
    expect(detail).toContain('Public description');expect(detail).not.toContain('guardian_phone');
    const unavailable=renderToStaticMarkup(createElement(SchoolEntry,{locale:'en',listing:{kind:'unavailable'}}));
    expect(unavailable).toContain('temporarily unavailable');expect(unavailable).not.toContain('No schools are publicly listed yet.');
  });
});
