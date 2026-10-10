'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {request,DashboardApiError} from '../../lib/restaurant-seller-browser';
import {useWorkDraft,dateText,type Order,type Terms} from '../../lib/restaurant-work';
import {workText} from '../../lib/restaurant-work-copy';
import {serviceText} from '../../lib/restaurant-service-copy';
import {serviceEnvelope,servicePath,serviceSelections,type ServiceAssignment,type ServiceEnvelope,type ServiceGroup} from '../../lib/restaurant-service-contract';
import {FoodTerms,ReceiptCard} from './restaurant-receipt';
import './restaurant-service.css';

type Item={public_ref:string;name:string;presentation:string;pricing_model:string;currency:string;unit_price?:string;minimum_amount?:string;allowed_amounts?:string[];amount_mode?:string;amount_step?:string;sale_unit_label?:string;availability:string;category?:{public_ref:string;name:string}};
type Selection={key:string;item_ref:string;quantity?:number;selected_amount?:string};
type Selections={standalone:Selection[];plates:{key:string;components:Selection[]}[]};
type Basket={basket_ref:string;revision:number;selections:Selections;quote:Terms|null;quote_ref:string|null;order_ref:string|null;food_preference:string|null};
type Workspace={items:Item[];intake_released:boolean};
type GroupSummary=Pick<ServiceGroup,'group_ref'|'revision'|'state'|'guest_confirmed'>;
type Proposal={proposal_ref:string;expires_at:string;group_ref:string;group_revision:number};
const empty=():Selections=>({standalone:[],plates:[]});
export function RestaurantService({path,binding,locale,assignment}:{path:string;binding:string;locale:'fr'|'en'|'ln'|'sw';assignment?:ServiceAssignment}){
 const t=useCallback((k:string)=>workText(locale,k),[locale]),s=useCallback((k:string)=>serviceText(locale,k),[locale]);
 const assignmentRef=assignment?.assignment_ref,assignmentRevision=assignment?.assignment_revision;
 const url=useCallback((suffix='',query:Record<string,string>={})=>servicePath(path,suffix,assignmentRef&&assignmentRevision?{assignment_ref:assignmentRef,assignment_revision:assignmentRevision}:undefined,query),[path,assignmentRef,assignmentRevision]);
 const [workspace,setWorkspace]=useState<Workspace|null>(null),[groups,setGroups]=useState<GroupSummary[]>([]),[group,setGroup]=useState<ServiceGroup|null>(null);
 const [page,setPage]=useState(1),[more,setMore]=useState(false),[basket,setBasket]=useState<Basket|null>(null),[selections,setSelections]=useState<Selections>(empty),[preference,setPreference]=useState('');
 const [order,setOrder]=useState<Order|null>(null),[proposal,setProposal]=useState<Proposal|null>(null),[anchor,setAnchor]=useState(''),[plate,setPlate]=useState(''),[search,setSearch]=useState('');
 const [pending,setPending]=useState<ServiceEnvelope|null>(null),[busy,setBusy]=useState(false),[fresh,setFresh]=useState(false),[message,setMessage]=useState(''),[lost,setLost]=useState(false),[dirty,setDirty]=useState(true);
 const [now,setNow]=useState(()=>Date.now());
 const alive=useRef(false),epoch=useRef(0),lock=useRef(false),current=useRef({group,basket,order});
 useEffect(()=>{current.current={group,basket,order};},[group,basket,order]);
 useWorkDraft(!!basket||!!pending,t('discard'));
 const invalidate=useCallback(()=>{epoch.current++;},[]);
 const clear=useCallback(()=>{invalidate();current.current={group:null,basket:null,order:null};setWorkspace(null);setGroups([]);setGroup(null);setBasket(null);setSelections(empty());setPreference('');setPlate('');setSearch('');setDirty(true);setOrder(null);setProposal(null);setAnchor('');setPending(null);setFresh(false);setLost(true);setMessage(s('lost'));},[s,invalidate]);
 const handle=useCallback((e:unknown,write=false)=>{
  if(e instanceof DashboardApiError&&[401,403,404].includes(e.status)){clear();return;}
  setFresh(false);setMessage(e instanceof DashboardApiError&&e.status===409?s('conflict'):write?s('uncertain'):s('stale'));
 },[clear,s]);
 const read=useCallback(async()=>{
  if(!navigator.onLine||document.hidden)return false;
  const generation=epoch.current,known=current.current;
  try{
   const w=await request(url('',{language:locale}),{},binding) as Workspace;
   const list=await request(url('/groups',{page:String(page)}),{},binding) as {items:GroupSummary[];has_more:boolean};
   const g=known.group?await request(url('/groups/'+known.group.group_ref),{},binding) as ServiceGroup:null;
   const b=known.basket?await request(url('/baskets/'+known.basket.basket_ref),{},binding) as Basket:null;
   const orderRef=b?.order_ref??known.order?.order_ref;
   const o=orderRef?await request(url('/orders/'+orderRef),{},binding) as Order:null;
   if(!alive.current||generation!==epoch.current)return false;
   setWorkspace(w);setGroups(list.items);setMore(list.has_more);if(g)setGroup(g);if(b)setBasket(b);if(o)setOrder(o);
   setNow(Date.now());setLost(false);setFresh(true);return true;
  }catch(e){if(alive.current&&generation===epoch.current)handle(e);return false;}
 },[url,locale,binding,page,handle]);
 useEffect(()=>{
  alive.current=true;let stopped=false,timer:ReturnType<typeof setTimeout>,delay=30000;
  const poll=async()=>{clearTimeout(timer);if(lock.current){timer=setTimeout(()=>void poll(),500);return;}lock.current=true;setBusy(true);
   try{const ok=await read();delay=ok?30000:Math.min(delay*2,120000);}finally{lock.current=false;if(!stopped){setBusy(false);timer=setTimeout(()=>void poll(),delay);}}
  };
  const resume=()=>{setFresh(false);if(navigator.onLine&&!document.hidden)void poll();},offline=()=>setFresh(false);
  void poll();window.addEventListener('online',resume);window.addEventListener('offline',offline);window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume);window.addEventListener('shida-signout',clear);
  return()=>{stopped=true;alive.current=false;invalidate();clearTimeout(timer);window.removeEventListener('online',resume);window.removeEventListener('offline',offline);window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume);window.removeEventListener('shida-signout',clear);};
 },[read,clear,invalidate]);
 useEffect(()=>{if(!proposal)return;const timer=setTimeout(()=>setNow(Date.now()),Math.max(0,Date.parse(proposal.expires_at)-Date.now()));return()=>clearTimeout(timer);},[proposal]);
 async function adopt(action:ServiceEnvelope,value:unknown){
  const actionPath=action.path.split('?')[0];
  if(actionPath.endsWith('/groups')){const g=value as ServiceGroup;setGroup(g);current.current.group=g;setProposal(null);}
  else if(actionPath.endsWith('/baskets')){const b=value as Basket;setBasket(b);current.current.basket=b;setSelections(b.selections);setPlate('');setPreference(b.food_preference??'');setDirty(true);setOrder(null);current.current.order=null;}
  else if(actionPath.endsWith('/submit')){const o=(value as {current_order:Order}).current_order;setOrder(o);current.current.order=o;setBasket(null);current.current.basket=null;setSelections(empty());setPreference('');}
  else if(actionPath.endsWith('/proposals')){const p=value as {proposal_ref:string;expires_at:string};const body=JSON.parse(action.body) as {expected_revision:number};setProposal({...p,group_ref:current.current.group!.group_ref,group_revision:body.expected_revision});setAnchor('');}
  else if(actionPath.endsWith('/close')){const g=(value as {group:ServiceGroup}).group;setGroup(g);current.current.group=g;}
  else if(actionPath.endsWith('/assisted_handover')){const o=(value as {current_order:Order}).current_order;setOrder(o);current.current.order=o;}
  else{const b=(value as {basket:Basket}).basket;setBasket(b);current.current.basket=b;setDirty(!actionPath.endsWith('/quote'));}
 }
 async function mutate(action:ServiceEnvelope,retry=false){
  if(lock.current||!navigator.onLine||lost||(!retry&&(!fresh||pending)))return;
  lock.current=true;setBusy(true);setMessage('');const generation=epoch.current;let committed=false;
  try{
   if(retry&&!await read())return;
   // Freeze the serialized body AND locator query. Reading never rewrites this envelope.
   setPending(action);
   const value=await request(action.path,{method:action.method,body:action.body},binding);
   if(!alive.current||generation!==epoch.current)return;
   committed=true;setPending(null);await adopt(action,value);await read();
  }catch(e){
   if(!alive.current||generation!==epoch.current)return;
   if(e instanceof DashboardApiError&&e.status<500&&e.status!==429){
    setPending(null);setDirty(true);setBasket(b=>b?{...b,quote:null,quote_ref:null}:null);
    handle(e);if(![401,403,404].includes(e.status)){await read();setMessage(s('conflict'));}
   }else handle(e,!committed);
  }finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 const action=(suffix:string,body:unknown,method='POST')=>mutate(serviceEnvelope(url(suffix),method,body));
 async function open(g:GroupSummary){
  if(lock.current||pending||basket||!navigator.onLine)return;
  lock.current=true;setBusy(true);const generation=epoch.current;
  try{const value=await request(url('/groups/'+g.group_ref),{},binding) as ServiceGroup;if(alive.current&&generation===epoch.current){setGroup(value);current.current.group=value;setOrder(null);current.current.order=null;setProposal(null);setFresh(true);}}
  catch(e){if(alive.current&&generation===epoch.current)handle(e);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 async function detail(ref:string){
  if(lock.current||!navigator.onLine)return;lock.current=true;setBusy(true);const generation=epoch.current;
  try{const value=await request(url('/orders/'+ref+'/receipt'),{},binding) as Order;if(alive.current&&generation===epoch.current){setOrder(value);current.current.order=value;}}
  catch(e){if(alive.current&&generation===epoch.current)handle(e);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 const locked=busy||!!pending||!fresh||lost,canAdd=!!group?.can_add_round&&!!workspace?.intake_released;
 function add(item:Item){
  if(locked)return;
  const line:Selection={key:crypto.randomUUID(),item_ref:item.public_ref,...(item.pricing_model==='UNIT_PRICED'?{quantity:1}:{selected_amount:item.amount_mode==='flexible'?item.minimum_amount:item.allowed_amounts?.[0]})};
  const index=Number(plate);
  const next=plate===''?{...selections,standalone:[...selections.standalone,line]}:index<0?{...selections,plates:[...selections.plates,{key:crypto.randomUUID(),components:[line]}]}:{...selections,plates:selections.plates.map((p,i)=>i===index?{...p,components:[...p.components,line]}:p)};
  if(!serviceSelections(next)){setMessage(t('validation'));return;}
  setSelections(next);if(index<0&&plate!=='')setPlate(String(next.plates.length-1));setDirty(true);
 }
 function change(key:string,patch:Partial<Selection>|null){
  const update=(lines:Selection[])=>patch?lines.map(l=>l.key===key?{...l,...patch}:l):lines.filter(l=>l.key!==key);
  setSelections(v=>({standalone:update(v.standalone),plates:v.plates.map(p=>({...p,components:update(p.components)})).filter(p=>p.components.length)}));setPlate('');setDirty(true);
 }
 const names=new Map(workspace?.items.map(i=>[i.public_ref,i.name]));
 const lineRows=(lines:Selection[])=>lines.map(l=><div className="rst-row" key={l.key}><span>{names.get(l.item_ref)??t('food')}</span><label>{t(l.quantity!==undefined?'quantity':'amount')}<input inputMode={l.quantity!==undefined?'numeric':'decimal'} type={l.quantity!==undefined?'number':'text'} min={1} step={1} value={l.quantity??l.selected_amount??''} onChange={e=>change(l.key,l.quantity!==undefined?{quantity:Number(e.target.value)}:{selected_amount:e.target.value.replace(',','.')})}/></label><button onClick={()=>change(l.key,null)}>{t('remove')}</button></div>);
 const proposalStale=proposal&&(!group||proposal.group_ref!==group.group_ref||proposal.group_revision!==group.revision||Date.parse(proposal.expires_at)<=now);
 return <article className="rst-card rst-work rst-service" lang={locale}><h2>{s('title')}</h2><p>{s('scope')}</p><p>{s('preparation')}</p>
 {workspace&&!workspace.intake_released&&<p role="status">{t('closed')}</p>}
 {message&&<p role="alert">{message}</p>}{!fresh&&!lost&&<p role="status">{s('stale')}</p>}
 <button disabled={busy} onClick={async()=>{if(lock.current)return;lock.current=true;setBusy(true);try{await read();}finally{lock.current=false;setBusy(false);}}}>{t('refresh')}</button>
 {pending&&<><p>{s('uncertain')}</p><button disabled={busy||!fresh||lost} onClick={()=>void mutate(pending,true)}>{s('retry')}</button></>}
 {!lost&&<><h3>{s('groups')}</h3><div className="rst-actions">{groups.map(g=><button disabled={locked||!!basket} key={g.group_ref} onClick={()=>void open(g)}>{g.group_ref} · {g.guest_confirmed?s('confirmed'):s('staffOnly')} · {g.state==='closed'?s('closed'):t('active')}</button>)}</div>
 <button disabled={locked||!!basket} onClick={()=>void action('/groups',{operation_key:crypto.randomUUID()})}>{s('newGroup')}</button>
 <div className="rst-actions"><button disabled={locked||!!basket||page<=1} onClick={()=>{setFresh(false);setPage(p=>p-1);}}>{t('previous')}</button><button disabled={locked||!!basket||!more} onClick={()=>{setFresh(false);setPage(p=>p+1);}}>{t('next')}</button></div>
 {group&&<section><h3>{group.group_ref}</h3><p>{group.guest_confirmed?s('confirmed'):s('staffOnly')}</p><p>{s('rounds')}</p>
 {!group.can_add_round&&<p>{s('closed')}</p>}<p>{dateText(group.order_until,locale)}</p>
 {group.rounds.map(r=><section className="rst-service-round" key={r.order_ref}><p>{r.order_ref} · {r.entry_source==='assisted'?s('staffRound'):s('guestRound')}</p><p>{t(r.state)} · {r.amount} {r.currency}</p>{r.cancellation_pending&&<p>{t('cancellation')}</p>}{r.entry_source==='assisted'&&<><button disabled={locked} onClick={()=>void detail(r.order_ref)}>{t('receipt')}</button>{r.state==='ready'&&<button disabled={locked} onClick={()=>{if(window.confirm(s('handoverConfirm')))void action('/orders/'+r.order_ref+'/actions/assisted_handover',{operation_key:crypto.randomUUID(),expected_revision:r.revision,confirm:true});}}>{s('handover')}</button>}</>}</section>)}
 {order&&<><ReceiptCard order={order} locale={locale}/>{order.assisted_handover&&<p>{s('attested')} · {dateText(order.assisted_handover.at,locale)}</p>}</>}
 {!basket&&<button disabled={locked||!canAdd} onClick={()=>void action('/baskets',{operation_key:crypto.randomUUID()})}>{s('more')}</button>}
 {group.can_add_round&&!group.guest_confirmed&&<fieldset disabled={locked||!!basket}><legend>{s('propose')}</legend><p>{s('proposalHelp')}</p><label>{s('anchor')}<input maxLength={64} value={anchor} onChange={e=>setAnchor(e.target.value)}/></label><button disabled={!/^[A-Za-z0-9_-]{1,64}$/.test(anchor)} onClick={()=>void action('/groups/'+group.group_ref+'/proposals',{operation_key:crypto.randomUUID(),expected_revision:group.revision,order_ref:anchor})}>{s('propose')}</button></fieldset>}
 {proposal&&!group.guest_confirmed&&<p role="status">{proposalStale?s('expired'):s('pending')+' '+dateText(proposal.expires_at,locale)}</p>}
 {group.can_add_round&&<button disabled={locked||!!basket} onClick={()=>{if(window.confirm(s('closeConfirm')))void action('/groups/'+group.group_ref+'/close',{operation_key:crypto.randomUUID(),expected_revision:group.revision});}}>{s('close')}</button>}
 </section>}
 {basket&&!basket.order_ref&&<section><fieldset disabled={locked||!canAdd}><label>{t('posSearch')}<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>{t('plate')}<select value={plate} onChange={e=>setPlate(e.target.value)}><option value="">{t('standalone')}</option><option value="-1">{t('add')} · {t('plate')}</option>{selections.plates.map((p,i)=><option key={p.key} value={String(i)}>{t('plate')} {i+1}</option>)}</select></label>
 <div className="rst-menu-rows">{workspace?.items.filter(i=>i.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(i=><div className="rst-menu-row" key={i.public_ref}><span>{i.name} · {i.pricing_model==='UNIT_PRICED'?i.unit_price:i.amount_mode==='flexible'?i.minimum_amount:i.allowed_amounts?.join(' / ')} {i.currency}</span><button disabled={i.availability!=='available'||i.pricing_model==='UNKNOWN'||plate!==''&&i.presentation!=='component'} onClick={()=>add(i)}>{t('add')}</button></div>)}</div>
 <h3>{t('standalone')}</h3>{lineRows(selections.standalone)}{selections.plates.map((p,i)=><section key={p.key}><h3>{t('plate')} {i+1}</h3>{lineRows(p.components)}</section>)}
 <label>{t('foodPreference')}<textarea maxLength={400} value={preference} onChange={e=>{setPreference(e.target.value);setDirty(true);}}/></label><p>{t('preferenceHelp')}</p>
 <button disabled={!serviceSelections(selections)||!selections.standalone.length&&!selections.plates.length} onClick={()=>void action('/baskets/'+basket.basket_ref+'/quote',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,selections,food_preference:preference||null})}>{t('quote')}</button></fieldset>
 {basket.quote&&!dirty&&<><FoodTerms terms={basket.quote} locale={locale}/><p>{s('rounds')}</p><button className="rst-service-send" disabled={locked||!canAdd} onClick={()=>void action('/baskets/'+basket.basket_ref+'/submit',{operation_key:crypto.randomUUID(),expected_revision:basket.revision,quote_ref:basket.quote_ref,confirm:true,group_ref:group!.group_ref,expected_group_revision:group!.revision})}>{s('send')}</button></>}
 </section>}</>}
 </article>;
}
