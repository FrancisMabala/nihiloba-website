import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShidaPage } from '../app/components/pages/shida-page';
import { ShidaStoryPage } from '../app/components/pages/shida-story-page';
import { DiscoveryListings } from '../app/components/pages/shida-discovery-listings';
import { discoveryCopy, discoveryLocales } from '../app/lib/discovery-copy';
import { discoverySearchDestination } from '../app/lib/discovery-search';
import { discoveryMetadata } from '../app/lib/discovery-metadata';
import { getJobs, getServices, ShidaApiError } from '../app/services/shida/public-client';
import { GET } from '../app/(default)/shida/find/route';
vi.mock('../app/services/shida/public-client', async importOriginal => ({ ...await importOriginal<typeof import('../app/services/shida/public-client')>(), getJobs: vi.fn(), getServices: vi.fn() }));
afterEach(()=>vi.resetAllMocks());

describe('SHIDA discovery', () => {
  it('keeps form redirects on the public origin behind a reverse proxy', () => {
    const result=GET(new Request('http://internal-host:3000/shida/find/?locale=fr&market=services&query=repair'));
    expect(result.status).toBe(303);
    expect(result.headers.get('Location')).toBe('/fr/shida/services?query=repair');
    expect(result.headers.get('Cache-Control')).toBe('no-store');
  });
  it.each(discoveryLocales)('keeps search, seven markets and separate SVG entries in %s', locale => {
    const html = renderToStaticMarkup(<ShidaPage locale={locale}/>);
    expect(html).toContain(discoveryCopy[locale].title);
    expect(html).toContain('action="/shida/find/"');
    expect(html.match(/class="discovery-icon discovery-icon-/g)).toHaveLength(7);
    expect(html.match(/class="discovery-illustration"/g)).toHaveLength(2);
    expect(html).toContain('https://business.nihiloba.com');
    expect(html).toContain('/shida/ecole');
    expect(html).toContain('/about/shida');
    expect(html).not.toContain('shida-hero.png');
    expect(discoveryMetadata(locale).alternates?.languages).toHaveProperty('sw', '/sw/shida');
  });
  it.each(['emplois','services','wenze','appartements','hotels','restaurants'])('preserves query and city for %s without adding unsupported filters', market => {
    expect(discoverySearchDestination(new URLSearchParams({market,locale:'fr',query:' réparation & entretien ',city:' Goma ',return:'https://example.com'}))).toBe(`/fr/shida/${market}?query=r%C3%A9paration+%26+entretien&city=Goma`);
  });
  it('rejects arbitrary destinations, limits input, and uses supported language routes', () => {
    expect(discoverySearchDestination(new URLSearchParams({market:'https://evil.test',locale:'xx'}))).toBe('/shida/emplois');
    expect(discoverySearchDestination(new URLSearchParams({market:'services',locale:'ln'}))).toBe('/ln/shida/services');
    expect(discoverySearchDestination(new URLSearchParams({market:'hotels',locale:'sw'}))).toBe('/fr/shida/hotels');
    expect(new URL(discoverySearchDestination(new URLSearchParams({query:'x'.repeat(200)})),'https://nihiloba.com').searchParams.get('query')).toHaveLength(120);
  });
  it.each(discoveryLocales)('renders distinct empty and failed collections in %s', async locale => {
    vi.mocked(getJobs).mockRejectedValue(new ShidaApiError('unavailable'));
    vi.mocked(getServices).mockResolvedValue({items:[],count:0,total:0,page:1,page_size:3});
    const html=renderToStaticMarkup(await DiscoveryListings({locale}));
    expect(html).toContain(discoveryCopy[locale].error);
    expect(html).toContain(discoveryCopy[locale].empty);
    expect(html).toContain(discoveryCopy[locale].retry);
    expect(html).not.toContain('Error:');
  });
  it('does not disguise programming errors as an empty feed',async()=>{
    vi.mocked(getJobs).mockRejectedValue(new Error('unexpected'));
    vi.mocked(getServices).mockResolvedValue({items:[],count:0,total:0,page:1,page_size:3});
    await expect(DiscoveryListings({locale:'en'})).rejects.toThrow('unexpected');
  });
  it('shows published service data, real currency and detail links without private addresses',async()=>{
    vi.mocked(getJobs).mockResolvedValue({items:[],pagination:{page:1,page_size:3,total_items:0,total_pages:0}});
    vi.mocked(getServices).mockResolvedValue({count:1,total:1,page:1,page_size:3,items:[{
      public_ref:'SVC_fixture',slug:'repairs',service_name:'Fixture repairs',provider:{public_ref:'SVI_fixture',slug:'atelier',name:'Fixture atelier',profile_image:null},
      category:'repair_maintenance',short_description:null,duration_minutes:60,starting_price:{public_ref:'SPK_fixture',name:'Visit',duration_minutes:60,price:'25000',currency:'CDF',description:null,booking_url:null},
      location:{country_code:'CD',city:'Kinshasa',area:null,commune:'Gombe',quartier:null,address_visibility:'private',address:'PRIVATE ADDRESS',landmark:null},
      location_type:'public_place',external_intervention_available:false,availability_mode:'flexible',rating:{average_rating:null,rating_count:0},image_preview:null,public_detail_url:'https://nihiloba.com/shida/services/repairs',booking_url:null,
    }]});
    const html=renderToStaticMarkup(await DiscoveryListings({locale:'sw'}));
    expect(html).toContain('Fixture repairs');expect(html).toContain('25000 CDF');
    expect(html).toContain('href="/sw/shida/services/repairs"');expect(html).toContain('Kinshasa');expect(html).not.toContain('PRIVATE ADDRESS');
  });
  it.each(['en','fr'] as const)('preserves the complete illustrated story in %s',locale=>{
    const html=renderToStaticMarkup(<ShidaStoryPage locale={locale}/>);
    expect(html.match(/class="shida-story shida-story-/g)).toHaveLength(8);
    expect(html).toContain('shida-hero.png');
    expect(html).toContain('id="school"');
  });
});
