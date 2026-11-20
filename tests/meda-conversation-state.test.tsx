import {describe, expect, it, vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {MedaConversationState} from '../app/lib/meda-conversation-state';
import {MedaAgreement, type MedaEnquiry, type MedaMessage} from '../app/components/shida/meda-participation';
import {medaParticipationCopy} from '../app/lib/meda-participation-copy';

const message = (id: number): MedaMessage => ({reference: `MSG_${id}`, body: `Message ${id}`,
  mine: false, created_at: new Date(Date.UTC(2026, 10, 20, 12, 0, id)).toISOString()});
const enquiry = (revision = 1, reference = 'ENQ_A'): MedaEnquiry => ({reference, revision,
  status: 'open', role: 'owner', can_reply: true, unread: 0, participant_label: 'Synthetic sender',
  listing: {reference:'MED_A', status:'published',title:'Books to Kinshasa',side:'offer',
    category:'luggage',origin_country:'FR',origin_city:'Paris',destination_country:'CD',destination_city:'Kinshasa',
    departure_at:'2027-01-20T12:00:00Z',deadline_at:'2027-01-19T12:00:00Z',capacity:'10',unit:'kg',
    description:'Synthetic listing for isolated tests',price:null,currency:null,price_basis:'discuss'},
  messages:[message(50)], older:'MSG_50'});

describe('Meda response ordering and enquiry isolation', () => {
  it('rejects a delayed refresh after a message mutation', () => {
    const state=new MedaConversationState();state.select('ENQ_A');
    state.accept(state.begin(),enquiry());const poll=state.begin(),mutation=state.begin();
    expect(state.accept(mutation,{...enquiry(2),messages:[message(50),message(51)]})?.revision).toBe(2);
    expect(state.accept(poll,enquiry())).toBeNull();
  });
  it('uses revision even when an older request observes a newer committed change', () => {
    const state=new MedaConversationState();state.select('ENQ_A');const first=state.begin(),second=state.begin();
    state.accept(second,enquiry(2));expect(state.accept(first,enquiry(3))?.revision).toBe(3);
  });
  it('does not restore stale same-revision state from an earlier request', () => {
    const state=new MedaConversationState();state.select('ENQ_A');const first=state.begin(),second=state.begin();
    state.accept(second,enquiry());expect(state.accept(first,{...enquiry(),unread:5})).toBeNull();
  });
  it('rejects a response after switching to another customer', () => {
    const state=new MedaConversationState();state.select('ENQ_A');const pending=state.begin();
    state.select('ENQ_B');state.accept(state.begin(),enquiry(1,'ENQ_B'));
    expect(state.accept(pending,enquiry(8))).toBeNull();
  });
  it('rejects the first visit response after leaving and reopening that same enquiry', () => {
    const state=new MedaConversationState();state.select('ENQ_A');const pending=state.begin();
    state.select(null);state.select('ENQ_A');expect(state.accept(pending,enquiry(8))).toBeNull();
  });
  it('rejects another enquiry returned for the selected request', () => {
    const state=new MedaConversationState();state.select('ENQ_A');
    expect(state.accept(state.begin(),enquiry(1,'ENQ_B'))).toBeNull();
  });
  it('preserves loaded history and deduplicates overlapping polls and pages', () => {
    const state=new MedaConversationState();state.select('ENQ_A');state.accept(state.begin(),enquiry());
    const older=state.begin('MSG_50');state.accept(older,{...enquiry(),messages:[message(1),message(50)],older:null});
    const result=state.accept(state.begin(),{...enquiry(2),messages:[message(50),message(51)],older:'MSG_50'});
    expect(result?.messages?.map(row=>row.reference)).toEqual(['MSG_1','MSG_50','MSG_51']);
    expect(result?.older).toBeNull();
  });
  it('merges a delayed history page without reverting new terms, status or permissions', () => {
    const state=new MedaConversationState();state.select('ENQ_A');state.accept(state.begin(),enquiry());
    const older=state.begin('MSG_50');
    state.accept(state.begin(),{...enquiry(3),status:'closed',can_reply:false,agreement:{version:2,mutual:true}});
    const result=state.accept(older,{...enquiry(),messages:[message(1)],older:null});
    expect(result).toMatchObject({revision:3,status:'closed',can_reply:false,agreement:{version:2,mutual:true},older:null});
    expect(result?.messages?.map(row=>row.reference)).toEqual(['MSG_1','MSG_50']);
  });
  it('does not advance a history cursor twice for duplicate in-flight pages', () => {
    const state=new MedaConversationState();state.select('ENQ_A');state.accept(state.begin(),enquiry());
    const first=state.begin('MSG_50'),second=state.begin('MSG_50');
    state.accept(second,{...enquiry(),messages:[message(1)],older:null});
    expect(state.accept(first,{...enquiry(),older:'MSG_1'})).toBeNull();
  });
});

describe('Meda agreement warning references the displayed terms', () => {
  for (const locale of ['en','fr','ln','sw'] as const) it(`shows version, total, dimensions and explicit free transport in ${locale}`, () => {
    const copy=medaParticipationCopy[locale],data=enquiry();
    data.agreement={version:3,values:{objects:{photos:[],contents:'Books in one box',weight_kg:2,packages:1,dimensions_cm:'20 × 30 × 40'},price:'0',currency:'CDF',free_transport:true,collection:'Public collection point',destination:'Agreed destination',conditions:'Check contents together'}};
    const html=renderToStaticMarkup(<MedaAgreement locale={locale} conversation={data} binding="unit-only" call={vi.fn()}/>);
    const warning=html.slice(html.indexOf('class="meda-warning"'));
    for (const value of [copy.version+' 3',copy.total,copy.free,'0 CDF']) expect(warning).toContain(value.replaceAll('’','’').replaceAll("'",'&#x27;'));
    expect(html).toContain('20 × 30 × 40');
    expect(warning).not.toContain('checked=""');
    expect(warning).toContain('disabled=""');
  });
});
