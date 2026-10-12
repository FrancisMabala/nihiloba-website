import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { restaurantAmount, restaurantPhotoUrl } from '../app/lib/restaurant-photo-public';
import { photoCopyKeys, photoText } from '../app/lib/restaurant-photo-copy';
import { PHOTO_MAX_BYTES } from '../app/lib/restaurant-photo-contract';
import { allowedSellerRoute, validSellerBody, validSellerQuery } from '../app/lib/restaurant-seller-contract';
import { parseRestaurant, parseMenuItem } from '../app/services/shida/restaurants-client';
import { RestaurantMenu } from '../app/components/shida/restaurants';
import { restaurant, unit } from './fixtures/restaurants.mjs';
const jar = new Map<string,string>();
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (key:string) => jar.has(key) ? { value: jar.get(key) } : undefined, set: vi.fn() }) }));
import { GET, POST } from '../app/api/shida/personal/restaurants/[[...path]]/route';
import { personalSessionBinding, PERSONAL_SESSION_COOKIE } from '../app/api/shida/employment/route-utils';
const token = 'test_session_photo_only_1234567890', revision = '2026-10-12T10:00:00.123456+00:00';
const upload = { upload_ref:'RPH_photo', target:'item', item_ref:'RMI_food', status:'staged', expires_at:'2026-10-13T10:00:00Z', revision };
const query = new URLSearchParams({target:'item',item_ref:'RMI_food',expected_updated_at:revision,operation_key:'photo-op'});
const context = (path:string) => ({params:Promise.resolve({path:path.split('/')})});
function req(path:string, method='GET', body?: BodyInit, headers:Record<string,string>={}) { return new Request(`https://nihiloba.com/api/shida/personal/restaurants/${path}`, {method,body,headers:{origin:'https://nihiloba.com','X-Shida-Session':personalSessionBinding(token),...headers}}); }
beforeEach(() => {vi.unstubAllGlobals();jar.clear();jar.set(PERSONAL_SESSION_COOKIE,token);});
it('recognizes only bounded public restaurant media and existing safe legacy URLs', () => {
 const url='https://api.nihiloba.com/api/restaurants/photos/RPH_photo';
 expect(restaurantPhotoUrl(url)).toBe(url);
 for(const value of [url+'?token=secret',url+'#secret',url+'/preview',url.replace('api.nihiloba.com','evil.test'),url.replace('https:','http:'),'https://api.nihiloba.com/api/dashboard/personal/restaurants/RST_a/photo-uploads/RPH_photo/preview']) expect(restaurantPhotoUrl(value)).toBeNull();
 expect(parseRestaurant({...restaurant,establishment_photo:{url,alt:'Chez maman'}}).establishment_photo).toEqual({url,alt:'Chez maman'});
 expect(parseMenuItem({...unit,image_url:url}).image_url).toBe(url);
});
it('preserves seller language, exact decimal prices and relevant availability without internal labels', () => {
 expect(restaurantAmount('9007199254740991.25','fr')).toBe('9 007 199 254 740 991,25');
 const html=renderToStaticMarkup(<RestaurantMenu locale="fr" items={[parseMenuItem({...unit,name:'Fumbwa ya maman',description:'Légumes du jour',currency:'CDF',unit_price:'3000.00',sale_unit_label:'assiette'})]}/>);
 expect(html).toContain('3 000 CDF');expect(html).toContain('assiette');expect(html).toContain('Fumbwa ya maman');expect(html).toContain('Légumes du jour');expect(html).not.toMatch(/COMPOSANT|fixed_dish|availability-available/);
});
it('has complete nonempty copy for all four interface languages', () => {
 for(const locale of ['en','fr','ln','sw'] as const) for(const key of photoCopyKeys) { const text=photoText(locale,key);expect(text.trim(),`${locale}:${key}`).not.toBe('');expect(text).not.toContain('�'); }
});
it('allows only documented upload, recovery, preview and explicit attachment', () => {
 expect(allowedSellerRoute('RST_a/photo-uploads','POST')).toBe(true);
 expect(allowedSellerRoute('RST_a/photo-uploads/RPH_photo/preview','GET')).toBe(true);
 expect(allowedSellerRoute('RST_a/photo-uploads/RPH_photo','DELETE')).toBe(false);
 expect(validSellerQuery('RST_a/photo-uploads','POST',query)).toBe(true);
 for(const extra of ['&target=item','&owner=1','&url=https://evil.test'])expect(validSellerQuery('RST_a/photo-uploads','POST',new URLSearchParams(query+extra))).toBe(false);
 const body={target:'item',item_ref:'RMI_food',expected_updated_at:revision,confirm:true};
 expect(validSellerBody('RST_a/photo-uploads/RPH_photo/attach','POST',body)).toBe(true);
 for(const value of [{...body,confirm:false},{...body,target:'establishment'},{...body,owner:1}])expect(validSellerBody('RST_a/photo-uploads/RPH_photo/attach','POST',value)).toBe(false);
});
it('forwards raw image bytes with session and Origin, projects only the documented envelope', async () => {
 const bytes=new Uint8Array([255,216,255,0,10]);const fetcher=vi.fn(async()=>Response.json({...upload,provider_key:'PRIVATE'}));vi.stubGlobal('fetch',fetcher);
 const response=await POST(req('RST_a/photo-uploads?'+query,'POST',bytes,{'Content-Type':'image/jpeg'}),context('RST_a/photo-uploads'));
 expect(response.status).toBe(200);expect(await response.json()).toEqual(upload);expect(response.headers.get('cache-control')).toContain('no-store');
 const [url,init]=fetcher.mock.calls[0] as unknown as [URL,RequestInit];expect(url.pathname).toBe('/api/dashboard/personal/restaurants/RST_a/photo-uploads');expect(url.searchParams.get('expected_updated_at')).toBe(revision);expect(init.body).toEqual(bytes);expect(init.headers).toMatchObject({'Content-Type':'image/jpeg',Cookie:`shida_dashboard_session=${token}`,Origin:'https://nihiloba.com'});
});
it('rejects actual oversized bytes, non-image data, stale session and cross-origin uploads', async () => {
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);const path='RST_a/photo-uploads?'+query;
 expect((await POST(req(path,'POST',new Uint8Array(PHOTO_MAX_BYTES+1),{'Content-Type':'image/jpeg'}),context('RST_a/photo-uploads'))).status).toBe(413);
 expect((await POST(req(path,'POST','{"url":"x"}',{'Content-Type':'application/json'}),context('RST_a/photo-uploads'))).status).toBe(422);
 expect((await POST(req(path,'POST','a',{'Content-Type':'image/jpeg','X-Shida-Session':'stale'}),context('RST_a/photo-uploads'))).status).toBe(401);
 expect((await POST(req(path,'POST','a',{'Content-Type':'image/jpeg',origin:'https://evil.test'}),context('RST_a/photo-uploads'))).status).toBe(403);expect(fetcher).not.toHaveBeenCalled();
});
it('streams a bounded private JPEG preview without JSON or public media caching', async () => {
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(new Uint8Array([255,216,255]),{headers:{'Content-Type':'image/jpeg'}})));
 const response=await GET(req('RST_a/photo-uploads/RPH_photo/preview'),context('RST_a/photo-uploads/RPH_photo/preview'));
 expect(response.status).toBe(200);expect(response.headers.get('content-type')).toBe('image/jpeg');expect(response.headers.get('cache-control')).toContain('private, no-store');expect((await response.arrayBuffer()).byteLength).toBe(3);
});
it('does not forward unexpected provider fields or malformed success responses', async () => {
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({...upload,status:'published'})));
 expect((await GET(req('RST_a/photo-uploads/RPH_photo'),context('RST_a/photo-uploads/RPH_photo'))).status).toBe(502);
});
