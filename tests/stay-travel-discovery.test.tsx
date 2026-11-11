import {afterEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ApartmentCollectionPage,HotelCollectionPage} from '../app/components/shida/marketplace-pages';
import {TransportDiscovery} from '../app/components/shida/transport-discovery';
import {HotelCard} from '../app/components/shida/marketplace';
import {StayTravelHero} from '../app/components/shida/stay-travel-discovery';
import {APARTMENTS_SLOGAN,HOTELS_SLOGAN,TRANSPORT_SLOGAN} from '../app/lib/brand';
import type {HotelListing} from '../app/types/shida-public';
afterEach(()=>vi.unstubAllGlobals());
it('keeps the exact Lingala slogans and original decorative artwork in every locale',()=>{
 for(const locale of ['en','fr','ln','sw'] as const)for(const [kind,slogan] of [['apartments',APARTMENTS_SLOGAN],['hotels',HOTELS_SLOGAN],['transport',TRANSPORT_SLOGAN]] as const){const html=renderToStaticMarkup(<StayTravelHero kind={kind} title={kind} locale={locale}/>);expect(html).toContain(`lang="ln">${slogan}`);expect(html).toContain(`/images/marketplace-heroes/${kind}.webp`);expect(html).toContain('alt=""');}
});
it('distinguishes an unpublished hotel collection from a failed request',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({items:[],count:0})));
 const empty=renderToStaticMarkup(await HotelCollectionPage({locale:'fr'}));expect(empty).toContain('Bienvenue sur Hôtels !');expect(empty).toContain('Ajouter mon établissement');expect(empty).not.toContain('Découvrir les appartements');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({detail:'unavailable'},{status:503})));
 const failed=renderToStaticMarkup(await HotelCollectionPage({locale:'fr',search:{query:'error-test'}}));expect(failed).not.toContain('Bienvenue sur Hôtels !');expect(failed).toContain('Réessayer');expect(failed).toContain('?query=error-test');
});
it('retains property filters, errors and publishing without creating synthetic records',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({items:[],count:0,total:0,page:1,page_size:12,filters:{property_types:['apartment','house']}})));
 const html=renderToStaticMarkup(await ApartmentCollectionPage({locale:'en',search:{city:'Goma',property_type:'house'}}));expect(html).toContain('value="Goma"');expect(html).toContain('Publish a property');expect(html).toContain('href="/shida/appartements/publier"');expect(html).not.toContain('Browse hotels');expect(html).not.toContain('marketplace-card-image');
});
it('keeps Wewa request and driver onboarding distinct and promises no live vehicles',()=>{
 for(const locale of ['en','fr','ln','sw'] as const){const html=renderToStaticMarkup(<TransportDiscovery locale={locale}/>);expect(html).toContain('text=wewa');expect(html).toContain('st-invitation');expect(html).not.toContain('Minibus');expect(html).not.toContain('mp-topline');}
 const html=renderToStaticMarkup(<TransportDiscovery locale="en"/>);expect(html).toContain('Opening WhatsApp alone does not create a request');expect(html).toContain('text=wewa+on');expect(html).toContain('does not show live vehicles');
});
it('keeps hotel prices separated by currency and period, including hourly rates',()=>{
 const hotel:HotelListing={public_ref:'test',slug:'test',name:'Controlled hotel',description:null,country_code:'CD',city:'Goma',area:null,commune:null,quartier:null,address_line:null,landmark:null,public_detail_url:'',booking_url:null,room_types:[{name:'Day room',price:10,currency:'USD',rental_period:'hourly',capacity:2,total_rooms:1,image_reference:null,image_references:[],description:null},{name:'Night',price:50000,currency:'CDF',rental_period:'night',capacity:2,total_rooms:1,image_reference:null,image_references:[],description:null}]};
 const html=renderToStaticMarkup(<HotelCard listing={hotel} locale="fr"/>);expect(html).toContain('/ heure');expect(html).toContain('/ nuit');expect(html).toContain('CDF');expect(html).not.toContain('rating');
});
