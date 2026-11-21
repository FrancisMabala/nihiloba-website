import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import {MedaListingForm,localMedaDate,type MedaListing} from '../app/components/shida/meda-listing-form';
import {ApplicationForm,MedaAgreement,type MedaEnquiry} from '../app/components/shida/meda-participation';
import {MedaProposalReview} from '../app/components/shida/meda-transport-proposal';
import {medaIntentionCopy} from '../app/lib/meda-intention-copy';
import {MedaPublication} from '../app/lib/meda-publication';
const listing:MedaListing={reference:'MED_synthetic',revision:1,status:'draft',title:'Books for Kinshasa',side:'request',category:'luggage',origin_country:'FR',origin_city:'Paris',destination_country:'CD',destination_city:'Kinshasa',departure_at:null,deadline_at:null,capacity:null,unit:'kg',description:'School books',price:null,currency:null,price_basis:'discuss',details:{objects:{photos:[],contents:'School books',weight_kg:null,packages:null,dimensions_cm:''}}};
const props={busy:false,onSave:vi.fn(),onCancel:vi.fn(),call:vi.fn(),binding:'synthetic'};
const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('’','’').replaceAll("'",'&#x27;').replaceAll('"','&quot;');
describe('Meda conditional authoring',()=>{
 for(const locale of ['fr','en','ln','sw'] as const)for(const side of ['request','offer'] as const)for(const category of ['luggage','airport','container'] as const){
  it(`${locale} ${side} ${category} shows only its relevant fields`,()=>{
   const html=renderToStaticMarkup(<MedaListingForm {...props} locale={locale} initial={{...listing,side,category}}/>);
   expect(html).toContain(escape(medaIntentionCopy[locale][side]));
   expect(html.includes('type="file"')).toBe(side==='request');
   expect(html.includes('name="capacity"')).toBe(side==='offer'&&category!=='container');
   expect(html.includes('name="collection_from"')).toBe(side==='offer'&&category==='container');
   expect(html.includes('name="departure_local"')).toBe(category==='airport');
   expect(html.includes('name="handover_local"')).toBe(side==='offer'&&category==='airport');
   expect(html.includes('name="departure_at"')).toBe(side==='offer'&&category!=='airport');
   expect(html.includes('name="payment_timing"')).toBe(side==='offer');
   expect(html.includes('name="budget"')).toBe(side==='request');
   expect(html.includes('name="departure_certainty"')).toBe(false);
   expect(html.match(/<button[^>]*value="publish"[^>]*disabled=""/)!==null).toBe(side==='request'&&category==='airport');
  });
 }
 it.each(['luggage','container','airport'] as const)('requires application photos only at the airport (%s)',category=>{
  const html=renderToStaticMarkup(<ApplicationForm locale="fr" call={vi.fn()} binding="synthetic" reference="MED_synthetic" category={category} onSaved={vi.fn()}/>);
  expect(/class="button button-primary" disabled=""/.test(html)).toBe(category==='airport');
 });
 it('formats airport time in the declared departure zone rather than browser time',()=>{
  expect(localMedaDate('2027-01-15T10:00:00Z','Africa/Kinshasa')).toBe('2027-01-15T11:00');
  expect(localMedaDate('2027-07-15T10:00:00Z','Europe/Paris')).toBe('2027-07-15T12:00');
 });
 it('accepts short object names such as TV while preserving offer and city limits',()=>{
  const sender=renderToStaticMarkup(<MedaListingForm {...props} locale="fr" initial={{...listing,title:'TV'}}/>);
  const title=sender.match(/<input[^>]*name="title"[^>]*>/)?.[0];expect(title).toContain('minLength="1"');expect(title).toContain('required=""');expect(title).toContain('value="TV"');
  expect(sender.match(/<input[^>]*name="origin_city"[^>]*>/)?.[0]).toContain('minLength="2"');
  const offer=renderToStaticMarkup(<MedaListingForm {...props} locale="fr" initial={{...listing,side:'offer'}}/>);
  expect(offer.match(/<input[^>]*name="title"[^>]*>/)?.[0]).toContain('minLength="3"');
 });
 it('keeps all required language keys meaningful',()=>{
  for(const copy of Object.values(medaIntentionCopy)){expect(Object.keys(copy).sort()).toEqual(Object.keys(medaIntentionCopy.en).sort());for(const value of Object.values(copy))expect(value.trim().length).toBeGreaterThan(0);}
 });
 it.each(['fr','en','ln','sw'] as const)('labels each carton without repeating the group title (%s)',locale=>{
  const html=renderToStaticMarkup(<MedaListingForm {...props} locale={locale} initial={{...listing,side:'offer',category:'container'}}/>),copy=medaIntentionCopy[locale];
  expect(html).toContain(`<legend>${escape(copy.cartons)}</legend>`);expect(html).toContain(`<legend>${escape(copy.carton)} 1</legend>`);expect(html).not.toContain(`<legend>${escape(copy.cartons)} 1</legend>`);
 });
 it('accepts ordinary whole carton dimensions and fractional kilograms on the browser number grid',()=>{
  const html=renderToStaticMarkup(<MedaListingForm {...props} locale="en" initial={{...listing,side:'offer',category:'container'}}/>);
  const fields=[...html.matchAll(/<input[^>]*type="number"[^>]*>/g)].map(([input])=>({min:Number(input.match(/ min="([^"]+)"/)?.[1]),step:Number(input.match(/ step="([^"]+)"/)?.[1]),required:input.includes('required=""')}));
  expect(fields).toHaveLength(5);expect(fields.slice(0,3)).toEqual(Array.from({length:3},()=>({min:.01,step:.01,required:true})));
  expect(fields[3]).toEqual({min:0,step:.01,required:true});expect(fields[4]).toEqual({min:.001,step:.001,required:false});
  // HTML step mismatch is determined relative to min. Previously min=.001 /
  // step=.01 rejected whole centimetres (60), so the form could never advance.
  for(const [index,value] of [60,40,50,25.50,12.125].entries()){const grid=(value-fields[index].min)/fields[index].step;expect(grid).toBeCloseTo(Math.round(grid),7);}
 });
});
describe('Meda publication recovery',()=>{
 it('does not finish authoring until publication resolves',async()=>{
  const state=new MedaPublication(),draft=vi.fn();let finish!:(v:MedaListing)=>void;
  const call=vi.fn().mockResolvedValueOnce(listing).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));let completed=false;
  const result=state.save(call,null,{title:'Books'},'synthetic-operation',true,draft).then(row=>{completed=true;return row;});
  await vi.waitFor(()=>expect(call).toHaveBeenCalledTimes(2));expect(draft).toHaveBeenCalledWith(listing);expect(completed).toBe(false);
  finish({...listing,status:'published',revision:2});expect((await result).status).toBe('published');
 });
 it('retries publication using the saved revision without creating another listing',async()=>{
  const state=new MedaPublication(),call=vi.fn().mockResolvedValueOnce(listing).mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce(listing).mockResolvedValueOnce({...listing,status:'published',revision:2});
  await expect(state.save(call,null,{title:'Books'},'synthetic-operation',true,vi.fn())).rejects.toThrow('offline');
  await state.save(call,null,{title:'Books'},'synthetic-operation',true,vi.fn());
  expect(call.mock.calls.map(c=>c[0])).toEqual(['listings/','listings/MED_synthetic/','listings/MED_synthetic/','listings/MED_synthetic/']);expect(call.mock.calls[2][1]).toBeUndefined();expect(call.mock.calls[3][1]).toEqual({action:'publish',revision:1});
 });
 it('saves revised input against the known draft before retrying publication',async()=>{
  const state=new MedaPublication(),call=vi.fn().mockResolvedValueOnce(listing).mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce(listing).mockResolvedValueOnce({...listing,revision:2}).mockResolvedValueOnce({...listing,status:'published',revision:3});
  await expect(state.save(call,null,{title:'Books'},'synthetic-operation',true,vi.fn())).rejects.toThrow();
  await state.save(call,null,{title:'More books'},'synthetic-operation',true,vi.fn());
  expect(call.mock.calls[3][1]).toEqual({action:'save',revision:1,values:{title:'More books'}});expect(call.mock.calls[4][1]).toEqual({action:'publish',revision:2});
 });
 it('recovers a lost successful publication response using exact owned state',async()=>{
  const state=new MedaPublication(),published={...listing,status:'published' as const,revision:2,enquiry_count:3};
  const call=vi.fn().mockResolvedValueOnce(listing).mockRejectedValueOnce(new TypeError('response lost')).mockResolvedValueOnce(published);
  expect(await state.save(call,null,{title:'Books'},'synthetic-operation',true,vi.fn())).toEqual(published);
  expect(call.mock.calls.map(c=>c[1])).toEqual([{operation_key:'synthetic-operation',values:{title:'Books'}},{action:'publish',revision:1},undefined]);
 });
 it('keeps the known draft after failed reconciliation and recovers on a later retry without another creation',async()=>{
  const state=new MedaPublication(),published={...listing,status:'published' as const,revision:2};
  const call=vi.fn().mockResolvedValueOnce(listing).mockRejectedValueOnce(new TypeError('lost')).mockRejectedValueOnce(new TypeError('read unavailable')).mockRejectedValueOnce(Object.assign(Error('meda_stale'),{status:409})).mockResolvedValueOnce(published);
  await expect(state.save(call,null,{title:'Books'},'synthetic-operation',true,vi.fn())).rejects.toThrow('read unavailable');
  expect(await state.save(call,null,{title:'Books'},'synthetic-operation',true,vi.fn())).toEqual(published);
  expect(call.mock.calls.filter(c=>c[0]==='listings/')).toHaveLength(1);
 });
 it.each([401,403,404])('does not convert a publication denial%d into success',async status=>{
  const state=new MedaPublication(),denied=Object.assign(Error('denied'),{status}),call=vi.fn().mockResolvedValueOnce(listing).mockRejectedValueOnce(denied);
  await expect(state.save(call,null,{title:'Books'},'synthetic-operation',true,vi.fn())).rejects.toBe(denied);expect(call).toHaveBeenCalledTimes(2);
 });
 it('propagates an ownership denial from reconciliation',async()=>{
  const state=new MedaPublication(),denied=Object.assign(Error('forbidden'),{status:403}),call=vi.fn().mockResolvedValueOnce(listing).mockRejectedValueOnce(Error('lost')).mockRejectedValueOnce(denied);
  await expect(state.save(call,null,{title:'Books'},'synthetic-operation',true,vi.fn())).rejects.toBe(denied);
 });
 it.each([
  {...listing,status:'published',revision:3},
  {...listing,status:'published',revision:2,title:'Changed by another tab'},
  {...listing,status:'published',revision:2,reference:'MED_other'},
  {...listing,status:'draft',revision:2},
  {...listing,status:'withdrawn',revision:2},
 ])('does not silently accept conflicting or newer listing state %j',async current=>{
  const state=new MedaPublication(),call=vi.fn().mockResolvedValueOnce(listing).mockRejectedValueOnce(Error('lost')).mockResolvedValueOnce(current);
  await expect(state.save(call,null,{title:'Books'},'synthetic-operation',true,vi.fn())).rejects.toThrow('meda_stale');
 });
});
describe('transport proposal consent',()=>{
 const values={objects:listing.details!.objects!,price:'20',currency:'USD',free_transport:false,collection:'City collection',destination:'City handover',conditions:'Inspect together',estimated_arrival:'2027-02-20T12:00:00Z',inclusions:'Transport costs'};
 const conversation:MedaEnquiry={reference:'MEQ_synthetic',revision:3,status:'open',listing,role:'owner',can_reply:true,unread:0,proposal:{reference:'MPR_synthetic',version:1,status:'proposed',values,can_decide:true,can_revise:false},agreement:{version:1,values}};
 it('proposal decisions are separate from final warning confirmation',()=>{
  const proposal=renderToStaticMarkup(<MedaProposalReview locale="en" conversation={conversation} call={vi.fn()} binding="synthetic"/>);
  expect(proposal).toContain('Accept proposal');expect(proposal).toContain('Decline proposal');expect(proposal).not.toContain('Confirm this agreement');
  const agreement=renderToStaticMarkup(<MedaAgreement locale="en" conversation={conversation} call={vi.fn()} binding="synthetic"/>);
  expect(agreement).not.toContain('I have read the warning');
  const accepted=renderToStaticMarkup(<MedaAgreement locale="en" conversation={{...conversation,proposal:{...conversation.proposal!,status:'accepted'}}} call={vi.fn()} binding="synthetic"/>);
  expect(accepted).toContain('I have read the warning');
 });
});
