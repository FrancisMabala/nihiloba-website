import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {MedaListingForm,type MedaListing} from '../app/components/shida/meda-listing-form';
import {MedaInvitation,MedaSearch,defaultMedaFilters} from '../app/components/shida/meda-discovery';
import {medaCopy,medaHistoryCopy} from '../app/lib/meda-copy';
import {medaParticipationCopy} from '../app/lib/meda-participation-copy';
import {medaDestination} from '../app/lib/meda-navigation';
import {ObjectFields,emptyObjects} from '../app/components/shida/meda-participation';
import type {MedaEnquiry} from '../app/components/shida/meda-participation';
import {MedaConversationHistory,captureMedaHistoryPosition,restoreMedaHistoryPosition} from '../app/components/shida/meda-marketplace';

const draft:MedaListing={reference:'MED_layout_fixture',revision:1,status:'draft',title:'Paris to Kinshasa books',side:'request',category:'container',origin_country:'FR',origin_city:'Paris',destination_country:'CD',destination_city:'Kinshasa',departure_at:'2027-02-20T14:00:00Z',deadline_at:'2027-02-19T14:00:00Z',capacity:null,unit:'m3',description:'Books packed in two small boxes.',price:null,currency:null,price_basis:'discuss',details:{volume_unknown:true,collection_area:'Paris centre',objects:{photos:[],contents:'Books packed in two small boxes.',weight_kg:'3',packages:2,dimensions_cm:'20 x 30 x 40'}}};
const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;');

describe('Meda mobile form structure and preserved contracts',()=>{
 for(const locale of ['en','fr','ln','sw'] as const){
  it(`labels each ${locale} photo input once using its unique heading and preserves audience help`,()=>{
   const html=renderToStaticMarkup(<><ObjectFields locale={locale} value={emptyObjects} onChange={vi.fn()} call={vi.fn()} binding="unit-only" required memberAudience/><ObjectFields locale={locale} value={emptyObjects} onChange={vi.fn()} call={vi.fn()} binding="unit-only"/></>);
   const headings=[...html.matchAll(/<h3 id="([^"]+)">([^<]+)<\/h3>/g)];
   expect(headings).toHaveLength(2);
   expect(headings[0][1]).not.toBe(headings[1][1]);
   expect(headings[0][2]).toBe(`${escape(medaParticipationCopy[locale].photos)} *`);
   expect(headings[1][2]).toBe(escape(medaParticipationCopy[locale].photos));
   for(const [,id] of headings){
    expect(html).toContain(`type="file" aria-labelledby="${id}" aria-describedby="${id}-help ${id}-audience"`);
    expect(html).toContain(`id="${id}-help"`);expect(html).toContain(`id="${id}-audience"`);
   }
   expect(html).not.toContain(`<label>${escape(medaParticipationCopy[locale].photos)}`);
   expect(html).toContain(escape(medaParticipationCopy[locale].memberPhotos));
   expect(html).toContain(escape(medaParticipationCopy[locale].privatePhotos));
  });
  it(`keeps every ${locale} step and draft field mounted, with one current step`,()=>{
   const html=renderToStaticMarkup(<MedaListingForm locale={locale} initial={draft} busy={false} onSave={vi.fn()} onCancel={vi.fn()} call={vi.fn()} binding="unit-only"/>);
   expect(html.match(/aria-current="step"/g)).toHaveLength(1);
   expect(html).toContain('tabindex="-1"');
   for(const label of medaParticipationCopy[locale].steps.split('|'))expect(html).toContain(escape(label));
   expect(html).toContain('data-step="0"');
   expect(html).toContain('data-step="1" hidden=""');
   expect(html).toContain('data-step="2" hidden=""');
   expect(html).toContain('name="origin_city"');expect(html).toContain('value="Paris"');
   expect(html).toContain('name="destination_city"');expect(html).toContain('value="Kinshasa"');
   expect(html).toContain('for="meda-from-country"');expect(html).toContain('id="meda-from-country"');
   expect(html).toContain('for="meda-to-country"');expect(html).toContain('id="meda-to-country"');
   expect(html).toContain('name="accepted_objects"');expect(html).toContain('name="included_services"');
   expect(html).toContain('name="arrival_from"');expect(html).toContain('name="arrival_to"');
   expect(html).toContain('accept="image/jpeg,image/png,image/webp"');
   expect(html).toContain(escape(medaParticipationCopy[locale].memberPhotos));
   // A request without photos must still be blocked from explicit publication.
   expect(html).toMatch(/<button[^>]*value="publish"[^>]*disabled=""/);
   expect(html).toContain(`>${escape(medaCopy[locale].save)}</button>`);
  });
  it(`keeps ${locale} discovery controls and the existing localized create destination`,()=>{
   const invitation=renderToStaticMarkup(<MedaInvitation locale={locale}/>);
   expect(invitation).not.toContain('<svg');
   expect(invitation).toContain(`href="${escape(medaDestination(locale,'create'))}"`);
   const html=renderToStaticMarkup(<MedaSearch locale={locale} filters={{...defaultMedaFilters,category:'container',side:'request',after:'2027-01-02'}} setFilters={vi.fn()} onSearch={vi.fn()} busy={false}/>);
   expect(html).toContain('role="search"');
   expect(html.match(/aria-pressed="true"/g)).toHaveLength(2);
   expect(html.match(/aria-pressed="false"/g)).toHaveLength(4);
   expect(html).toContain('type="date" value="2027-01-02"');
  });
 }
 it('retains explicit publish and separate draft actions when request photos exist',()=>{
  const withPhotos={...draft,details:{...draft.details,objects:{...draft.details!.objects!,photos:['MPH_unit']}}};
  const html=renderToStaticMarkup(<MedaListingForm locale="en" initial={withPhotos} busy={false} onSave={vi.fn()} onCancel={vi.fn()} call={vi.fn()} binding="unit-only"/>);
  expect(html).toMatch(/<button[^>]*type="submit" value="publish">/);
  expect(html.match(/type="submit"/g)).toHaveLength(2);
  expect(html).not.toContain('disabled=""');
 });
});

// Explicit geometry doubles exercise the same scroll operations used by the
// component. Real browser layout/touch and keyboard acceptance remain separate.
function historyGeometry(){
 let ids=Array.from({length:50},(_,i)=>`MSG_${i+50}`),top=0,height=300;
 const region={get scrollHeight(){return ids.length*100;},get clientHeight(){return height;},get scrollTop(){return top;},set scrollTop(value:number){top=Math.max(0,Math.min(value,ids.length*100-height));},getBoundingClientRect:()=>({top:0}),querySelectorAll:()=>ids.map((id,index)=>({dataset:{messageRef:id},getBoundingClientRect:()=>({top:index*100-top,bottom:(index+1)*100-top})}))} as unknown as HTMLDivElement;
 return {region,prependAndAppend:()=>{ids=[...Array.from({length:10},(_,i)=>`MSG_${i+40}`),...ids,'MSG_100'];},append:()=>{ids.push('MSG_100');},resize:(value:number)=>{height=value;}};
}
describe('Meda bounded history position',()=>{
 it('opens at the latest message and follows a new message only while already at the end',()=>{
  const {region,append}=historyGeometry();const initial=restoreMedaHistoryPosition(region,null);
  expect(region.scrollTop).toBe(4700);expect(initial.following).toBe(true);
  append();restoreMedaHistoryPosition(region,initial);expect(region.scrollTop).toBe(4800);
 });
 it('preserves the visible older message and offset when earlier and new messages arrive together',()=>{
  const {region,prependAndAppend}=historyGeometry();restoreMedaHistoryPosition(region,null);region.scrollTop=1250;
  const before=captureMedaHistoryPosition(region);expect(before.anchor).toBe('MSG_62');expect(before.offset).toBe(-50);
  prependAndAppend();const after=restoreMedaHistoryPosition(region,before);
  expect(region.scrollTop).toBe(2250);expect(after.anchor).toBe(before.anchor);expect(after.offset).toBe(before.offset);expect(after.following).toBe(false);
 });
 it('does not jump to new messages while the reader is looking through earlier history',()=>{
  const {region,append}=historyGeometry();region.scrollTop=1200;const before=captureMedaHistoryPosition(region);
  append();restoreMedaHistoryPosition(region,before);expect(region.scrollTop).toBe(1200);
 });
 it('keeps the end visible after a keyboard-sized resize without moving an older reader',()=>{
  const {region,resize}=historyGeometry();const before=restoreMedaHistoryPosition(region,null);resize(180);
  restoreMedaHistoryPosition(region,before);expect(region.scrollTop).toBe(4820);
  region.scrollTop=1250;const reading=captureMedaHistoryPosition(region);resize(300);
  restoreMedaHistoryPosition(region,reading);expect(region.scrollTop).toBe(1250);
 });
 for(const locale of ['en','fr','ln','sw'] as const)it(`retains all history in a keyboard reachable, named ${locale} region`,()=>{
  const conversation:MedaEnquiry={reference:'MEQ_unit',revision:1,status:'open',role:'owner',can_reply:true,unread:0,listing:draft,older:'MSG_50',messages:Array.from({length:50},(_,i)=>({reference:`MSG_${i+50}`,body:`Retained message ${i+50}`,mine:false,created_at:'2026-11-20T12:00:00Z'}))};
  const html=renderToStaticMarkup(<MedaConversationHistory conversation={conversation} locale={locale} busy={false} onOlder={vi.fn()}/>);
  expect(html).toContain(`role="region" aria-label="${medaHistoryCopy[locale].history}" tabindex="0"`);
  expect(html.match(/data-message-ref=/g)).toHaveLength(50);expect(html).toContain('Retained message 50');expect(html).toContain('Retained message 99');
  expect(html).toContain(escape(medaCopy[locale].older));expect(html).toContain(medaHistoryCopy[locale].latest);
 });
});
