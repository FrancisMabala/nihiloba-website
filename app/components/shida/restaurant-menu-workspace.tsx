'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {request,DashboardApiError} from '../../lib/restaurant-seller-browser';
import {pricing,type Row,type Envelope,type Page,type Establishment,type Fields} from '../../lib/restaurant-seller';
import {restaurantText} from '../../lib/restaurant-seller-copy';
import {basicText} from '../../lib/restaurant-basic-copy';
import {workText} from '../../lib/restaurant-work-copy';
import {SpaceIcon} from './account-space-icon';
import {menuText,type MenuCopyKey} from '../../lib/restaurant-menu-redesign-copy';
import {photoText} from '../../lib/restaurant-photo-copy';
import {PHOTO_MAX_BYTES,PHOTO_TYPES} from '../../lib/restaurant-photo-contract';
import {restaurantAmount} from '../../lib/restaurant-photo-public';
import {useWorkDraft,leaveWork} from '../../lib/restaurant-work';
import type {RestaurantLocale} from '../../services/shida/restaurants-client';
import {RestaurantPhoto} from './restaurant-photo';
import {RestaurantPhotoEditor} from './restaurant-photo-editor';
import {RestaurantCounterOptions} from './restaurant-counter-options';
import './restaurant-menu-workspace.css';

type Item=Row&{counter_options?:{portions:{key:string;label:string;amount:string}[];extras:{key:string;label:string;amount:string}[]}|null;menu_state?:string;enable_blocker?:string|null;preparation_station?:string|null};
type Draft={ref?:string;revision:string;fields:Record<string,string>;changed:string[];route:string;oldRoute:string;categoryName:string;separate:boolean;file:File|null};
type Pending={url:string;method:string;body:string};
type Journey={intent:'later'|'available'|'save';stage:'item'|'route'|'enable'|'done';ref?:string;revision:string;pending?:Pending;draft:Draft};
const keys=['name','category_ref','description','pricing_model','currency','sale_unit_label','unit_price','allowed_amounts','minimum_amount','amount_mode','amount_step','visible','availability','permanent','presentation'];
const priceKeys=['pricing_model','currency','sale_unit_label','unit_price','allowed_amounts','minimum_amount','amount_mode','amount_step'];
const toFields=(row:Item,currency:string)=>Object.fromEntries(keys.map(key=>[key,key==='category_ref'?row.category?.public_ref??'':Array.isArray(row[key])?(row[key] as string[]).join(';'):String(row[key]??({pricing_model:'UNIT_PRICED',currency,amount_mode:'configured',visible:'false',availability:'temporarily_unavailable',permanent:'true',presentation:'fixed_dish'} as Record<string,string>)[key]??'')]));

export function RestaurantMenuWorkspace({path,binding,locale,establishmentName,onOpen,onFailure}:{path:string;binding:string;locale:RestaurantLocale;establishmentName:string;onOpen:(tab:string)=>void;onFailure:(error:unknown)=>void}){
 const m=(key:MenuCopyKey)=>menuText(locale,key),t=(key:string)=>['amount_mode','configured','flexible','amount_step'].includes(key)?basicText(locale,key):restaurantText(locale,key);
 const [data,setData]=useState<Envelope<Page<Item>>|null>(null),[parent,setParent]=useState<Establishment|null>(null),[categories,setCategories]=useState<Row[]>([]);
 const [search,setSearch]=useState(''),[category,setCategory]=useState(''),[state,setState]=useState(''),[page,setPage]=useState(1),[refresh,setRefresh]=useState(0);
 const [loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[busy,setBusy]=useState(false),[draft,setDraft]=useState<Draft|null>(null),[message,setMessage]=useState(''),[blocked,setBlocked]=useState(false),[reviewed,setReviewed]=useState(false),[latest,setLatest]=useState<Item|null>(null),[duplicate,setDuplicate]=useState(false),[photoTarget,setPhotoTarget]=useState<{ref:string;file:File|null}|null>(null);
 const lock=useRef(false),alive=useRef(true),generation=useRef(0),journey=useRef<Journey|null>(null),failure=useRef(onFailure),opener=useRef<HTMLElement|null>(null),heading=useRef<HTMLHeadingElement>(null),scroll=useRef(0);
 useEffect(()=>{failure.current=onFailure;},[onFailure]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useWorkDraft(!!draft,workText(locale,'discard'),locale);
 const read=useCallback(async<T,>(url:string)=>await request(`${url}${url.includes('?')?'&':'?'}language=${locale}`,{},binding) as T,[binding,locale]);
 function fail(error:unknown){
  if(!alive.current)return;
  if(error instanceof DashboardApiError&&[401,403,404].includes(error.status)){setData(null);setDraft(null);setPhotoTarget(null);journey.current=null;failure.current(error);return;}
  if(error instanceof DashboardApiError&&error.status===409){setBlocked(true);setReviewed(false);setMessage(m('conflict'));return;}
  if(error instanceof DashboardApiError&&[400,422].includes(error.status)){journey.current=null;setDuplicate(error.detail==='restaurant_item_review_required');}
  setMessage(error instanceof DashboardApiError&&error.detail==='restaurant_item_review_required'?m('duplicate'):m('error'));
 }
 useEffect(()=>{let active=true;void Promise.all([read<Establishment>(path),(async()=>{const result:Row[]=[];for(let p=1;;p++){const v=await read<Envelope<Page<Row>>>(`${path}/menu/categories?page=${p}&page_size=50`);result.push(...v.result.items);if(result.length>=v.result.total||!v.result.items.length)return result;}})()]).then(([p,c])=>{if(active){setParent(p);setCategories(c);}}).catch(e=>{if(active)fail(e);});return()=>{active=false;};},[path,read]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{
  const token=++generation.current;
  const timer=setTimeout(()=>{setLoading(true);const query=new URLSearchParams({overview:'true',page:String(page),page_size:'20'});if(search.trim())query.set('search',search.trim());if(category)query.set('category_ref',category);if(state)query.set('menu_state',state);
   void read<Envelope<Page<Item>>>(`${path}/menu/items?${query}`).then(value=>{if(alive.current&&token===generation.current){setData(value);setFailed(false);}}).catch(e=>{if(alive.current&&token===generation.current){setFailed(true);fail(e);}}).finally(()=>{if(alive.current&&token===generation.current)setLoading(false);});
  },search?250:0);return()=>clearTimeout(timer);
 },[path,read,search,category,state,page,refresh]); // eslint-disable-line react-hooks/exhaustive-deps
 const [localPhoto,setLocalPhoto]=useState('');
 useEffect(()=>()=>{if(localPhoto)URL.revokeObjectURL(localPhoto);},[localPhoto]);
 const editing=!!draft,editingPhoto=!!photoTarget;
 useEffect(()=>{if(editing||editingPhoto)heading.current?.focus();},[editing,editingPhoto]);
 function change(key:string,value:string){setDraft(old=>old?{...old,fields:{...old.fields,[key]:value},changed:[...new Set([...old.changed,key])]}:null);setMessage('');setReviewed(false);}
 async function open(row?:Item){
  setLocalPhoto('');
  if(lock.current)return;opener.current=document.activeElement as HTMLElement;scroll.current=window.scrollY;lock.current=true;setBusy(true);setMessage('');setBlocked(false);setLatest(null);setDuplicate(false);journey.current=null;
  try{const current=row?await read<Envelope<Item>>(`${path}/menu/items/${row.public_ref}?overview=true`):null;const p=current?null:await read<Establishment>(path);if(!alive.current)return;
   const next={ref:row?.public_ref,revision:current?.revision??p!.revision,fields:toFields(current?.result??({public_ref:''} as Item),current?.currency??p?.menu_currency??'CDF'),changed:[],route:current?.result.preparation_station??'kitchen',oldRoute:current?.result.preparation_station??'',categoryName:'',separate:false,file:null};setDraft(next);return next;
  }catch(e){fail(e);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 async function close(){if(lock.current||!await leaveWork())return;setDraft(null);setPhotoTarget(null);journey.current=null;setBlocked(false);setLatest(null);setMessage('');requestAnimationFrame(()=>{window.scrollTo({top:scroll.current});opener.current?.focus();});}
 function itemFields(d:Draft,intent:Journey['intent']):Fields{
  const fields:Fields={};for(const key of d.ref?d.changed:keys){if(key==='category_ref'&&!d.ref)continue;fields[key]=['visible','permanent'].includes(key)?d.fields[key]==='true':d.fields[key]||null;}
  if(!d.ref||d.changed.some(key=>priceKeys.includes(key)))Object.assign(fields,pricing(d.fields));
  if(!d.ref||intent==='later')Object.assign(fields,{visible:false,availability:'temporarily_unavailable'});
  return fields;
 }
 async function save(intent:Journey['intent'],source=draft){
  if(lock.current||!source||blocked&&!reviewed)return;
  if(!journey.current){try{itemFields(source,intent);}catch{setMessage(workText(locale,'validation'));return;}}
  lock.current=true;setBusy(true);setMessage('');
  const j=journey.current??{intent,stage:'item' as const,ref:source.ref,revision:source.revision,draft:{...source,fields:{...source.fields}}};journey.current=j;
  async function command<T>(url:string,method:string,body:unknown){j.pending??={url,method,body:JSON.stringify(body)};const op=j.pending;const result=await request(op.url,{method:op.method,body:op.body},binding) as T;if(!alive.current)throw new Error('unmounted');j.pending=undefined;return result;}
  try{
   if(j.stage==='item'){
    const fields=itemFields(j.draft,j.intent);
    if(j.ref){if(Object.keys(fields).length){const v=await command<Envelope<Item>>(`${path}/menu/items/${j.ref}?language=${locale}`,'PATCH',{operation_key:crypto.randomUUID(),expected_updated_at:j.revision,fields});j.revision=v.revision;}}
    else{const v=await command<{revision:string;operation_outcome:{items:{item_ref:string}[]}}>(`${path}/menu-batches?language=${locale}`,'POST',{operation_key:crypto.randomUUID(),expected_updated_at:j.revision,...(j.draft.fields.category_ref?{category_ref:j.draft.fields.category_ref}:{category_name:j.draft.categoryName}),rows:[{key:'item',fields,separate:j.draft.separate}]});j.ref=v.operation_outcome.items[0].item_ref;j.revision=v.revision;}
    j.stage='route';setDraft(old=>old?{...old,ref:j.ref,revision:j.revision,changed:[]}:null);
   }
   if(j.stage==='route'){
    if(j.draft.route!==j.draft.oldRoute){const v=await command<{revision:string}>(`${path}/preparation-routing/${j.ref}`,'PUT',{operation_key:crypto.randomUUID(),expected_updated_at:j.revision,station:j.draft.route});j.revision=v.revision;}
    j.stage='enable';
   }
   if(j.stage==='enable'){
    if(j.intent==='available'){
     if(!j.pending){
     const v=await read<Envelope<Item>>(`${path}/menu/items/${j.ref}?overview=true`);
     if(v.revision!==j.revision)throw new DashboardApiError('conflict',409);
     if(v.result.enable_blocker){setMessage(m(('blocker_'+v.result.enable_blocker) as MenuCopyKey));setDraft(old=>old?{...old,ref:j.ref,revision:j.revision,oldRoute:j.draft.route,changed:[]}:null);journey.current=null;setRefresh(n=>n+1);return;}
     }
     const value=await command<Envelope<Item>>(`${path}/menu/items/${j.ref}?language=${locale}`,'PATCH',{operation_key:crypto.randomUUID(),expected_updated_at:j.revision,fields:{visible:true,availability:'available'}});j.revision=value.revision;
    }
    j.stage='done';
   }
   const current=await read<Envelope<Item>>(`${path}/menu/items/${j.ref}?overview=true`);
   journey.current=null;setBlocked(false);setLatest(null);setRefresh(n=>n+1);setDuplicate(false);
   if(j.draft.file){setPhotoTarget({ref:j.ref!,file:j.draft.file});setDraft(null);setMessage(m('photoContinue'));}
   else{setDraft(null);setMessage(current.result.menu_state==='unpublished'?m('unpublished'):m('saved'));requestAnimationFrame(()=>window.scrollTo({top:scroll.current}));}
  }catch(e){fail(e);}finally{lock.current=false;if(alive.current)setBusy(false);}
 }
 async function reload(){if(!draft||lock.current)return;lock.current=true;setBusy(true);try{const current=draft.ref?await read<Envelope<Item>>(`${path}/menu/items/${draft.ref}?overview=true`):null;const p=current?null:await read<Establishment>(path);if(!alive.current)return;setLatest(current?.result??null);setDraft(old=>old?{...old,revision:current?.revision??p!.revision,oldRoute:current?.result.preparation_station??''}:null);journey.current=null;setBlocked(true);setReviewed(false);setMessage(m('conflict'));}catch(e){fail(e);}finally{lock.current=false;if(alive.current)setBusy(false);}}
 async function toggle(row:Item){const d=await open(row);if(!d||!alive.current)return;const next:Draft={...d,oldRoute:d.route,changed:row.availability==='available'?['availability']:[],fields:{...d.fields,...(row.availability==='available'?{availability:'temporarily_unavailable'}:{})}};setDraft(next);await save(row.availability==='available'?'save':'available',next);}
 function price(row:Item){const amount=(v:unknown)=>typeof v==='string'||typeof v==='number'?restaurantAmount(String(v),locale):'—';return row.pricing_model==='UNIT_PRICED'?`${amount(row.unit_price)} ${row.currency??''} / ${row.sale_unit_label??''}`:row.pricing_model==='AMOUNT_PRICED'?`${row.amount_mode==='flexible'?amount(row.minimum_amount)+'+':Array.isArray(row.allowed_amounts)?row.allowed_amounts.map(amount).join(' / '):'—'} ${row.currency??''}`:t('UNKNOWN');}
 const locked=busy||!!journey.current;
 const input=(key:string,label:string,required=false)=><label>{label}<input required={required} value={draft!.fields[key]??''} inputMode={priceKeys.includes(key)&&key!=='sale_unit_label'?'decimal':undefined} onChange={e=>change(key,e.target.value)}/></label>;
 return <section className="rst-menu-workspace">
 <header className="rst-menu-title"><div><h2 ref={heading} tabIndex={-1}>{draft?draft.ref?t('edit'):m('add'):photoTarget?m('photo'):m('title')}</h2>{!draft&&!photoTarget&&<p>{m('intro')}</p>}</div>{(draft||photoTarget)&&<button type="button" disabled={busy} onClick={()=>void close()}>← {m('title')}</button>}</header>
 {message&&<p role="status" className="rst-menu-message">{message}</p>}
 {photoTarget?<RestaurantPhotoEditor path={path} binding={binding} locale={locale} establishmentName={establishmentName} target="item" itemRef={photoTarget.ref} initialFile={photoTarget.file??undefined} embedded onFailure={onFailure} onBack={()=>void close()}/>:draft?<>
 <form className="rst-menu-form" onSubmit={e=>{e.preventDefault();void save(draft.ref?'save':'available');}}>
 {journey.current?.ref&&journey.current.stage!=='item'&&<p>{m('partial')}</p>}
 <fieldset disabled={locked||blocked&&!reviewed}>
 {input('name',m('name'),true)}
 <label>{m('category')}<select required={!!draft.ref} value={draft.fields.category_ref} onChange={e=>change('category_ref',e.target.value)}><option value="">{m('categoryNew')}</option>{categories.map(c=><option key={c.public_ref} value={c.public_ref}>{c.name}</option>)}</select></label>
 {!draft.ref&&!draft.fields.category_ref&&<label>{m('categoryNew')}<input required maxLength={200} value={draft.categoryName} onChange={e=>setDraft({...draft,categoryName:e.target.value})}/></label>}
 <div className="rst-menu-price-fields"><label>{m('mode')}<select value={draft.fields.pricing_model} onChange={e=>change('pricing_model',e.target.value)}>{['UNIT_PRICED','AMOUNT_PRICED','UNKNOWN'].map(key=><option key={key} value={key}>{t(key)}</option>)}</select></label>
 {draft.fields.pricing_model!=='UNKNOWN'&&<label>{m('currency')}<select value={draft.fields.currency} disabled={!!parent?.menu_currency} onChange={e=>change('currency',e.target.value)}><option>CDF</option><option>USD</option></select></label>}</div>
 <p className="rst-menu-help">{m(draft.fields.pricing_model==='UNIT_PRICED'?'fixedHelp':draft.fields.pricing_model==='AMOUNT_PRICED'?'amountHelp':'unknownHelp')}</p>
 {draft.fields.pricing_model==='UNIT_PRICED'&&<div className="rst-menu-price-fields">{input('unit_price',m('price'),true)}{input('sale_unit_label',m('unit'),true)}</div>}
 {draft.fields.pricing_model==='AMOUNT_PRICED'&&<><label>{t('amount_mode')}<select value={draft.fields.amount_mode} onChange={e=>change('amount_mode',e.target.value)}><option value="configured">{t('configured')}</option><option value="flexible">{t('flexible')}</option></select></label>{draft.fields.amount_mode==='flexible'?<>{input('minimum_amount',t('minimum_amount'),true)}{input('amount_step',t('amount_step'))}</>:<>{input('allowed_amounts',t('allowed_amounts'),true)}{input('minimum_amount',t('minimum_amount'))}</>}</>}
 <fieldset className="rst-menu-preparation"><legend>{m('preparation')}</legend>{['serve','kitchen',...(draft.oldRoute==='bar'?['bar']:[])].map(value=><label key={value}><input type="radio" name="menu-preparation" checked={draft.route===value} onChange={()=>setDraft({...draft,route:value})}/>{m(value as 'serve'|'kitchen'|'bar')}</label>)}<p>{m('preparationHelp')}</p></fieldset>
 <details><summary>{m('extras')}</summary><label>{t('description')}<textarea rows={3} value={draft.fields.description} onChange={e=>change('description',e.target.value)}/></label><label>{t('presentation')}<select value={draft.fields.presentation} onChange={e=>change('presentation',e.target.value)}><option value="fixed_dish">{t('fixed_dish')}</option><option value="component">{t('component')}</option></select></label><label className="rst-menu-check"><input type="checkbox" checked={draft.fields.permanent==='true'} onChange={e=>change('permanent',String(e.target.checked))}/>{t('permanent')}</label>{draft.ref&&<><label className="rst-menu-check"><input type="checkbox" checked={draft.fields.visible==='true'} onChange={e=>change('visible',String(e.target.checked))}/>{t('visible')}</label><label>{m('status')}<select value={draft.fields.availability} onChange={e=>change('availability',e.target.value)}>{['available','temporarily_unavailable','sold_out'].map(s=><option key={s} value={s}>{t(s)}</option>)}</select></label></>}</details>
 <section className="rst-menu-photo"><h3>{m('photo')}</h3><p>{photoText(locale,'guidance')}</p><div className="rst-menu-photo-actions">{['camera','choose'].map(kind=><label className="rst-menu-file" key={kind}>{photoText(locale,kind as 'camera'|'choose')}<input type="file" accept="image/jpeg,image/png,image/webp" capture={kind==='camera'?'environment':undefined} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!PHOTO_TYPES.includes(file.type)||file.size>PHOTO_MAX_BYTES||!file.size){setMessage(photoText(locale,'invalid'));return;}setDraft({...draft,file});setLocalPhoto(URL.createObjectURL(file));}}/></label>)}</div>{localPhoto&&<><Image src={localPhoto} width={160} height={120} alt={photoText(locale,'preview')} unoptimized/><button type="button" onClick={()=>{setDraft({...draft,file:null});setLocalPhoto('');}}>{t('remove')}</button></>}{draft.ref&&!draft.changed.length&&draft.route===(draft.oldRoute||'kitchen')&&!draft.file&&<button type="button" onClick={()=>{setPhotoTarget({ref:draft.ref!,file:null});setDraft(null);}}>{photoText(locale,'item')}</button>}</section>
 {duplicate&&!draft.ref&&<label className="rst-menu-check"><input type="checkbox" checked={draft.separate} onChange={e=>{setDraft({...draft,separate:e.target.checked});journey.current=null;}}/>{m('separate')}</label>}
 </fieldset>
 {blocked&&<div className="rst-menu-review"><button type="button" disabled={busy} onClick={()=>void reload()}>{t('reload')}</button>{latest&&<p>{latest.name} · {price(latest)} · {String(latest.description??'')}</p>}<label className="rst-menu-check"><input type="checkbox" checked={reviewed} disabled={!!journey.current} onChange={e=>setReviewed(e.target.checked)}/>{m('reviewed')}</label></div>}
 <p>{m('laterHelp')}</p>{parent?.status!=='active'&&<p>{m('unpublished')}</p>}
 <div className="rst-menu-save"><button type="button" disabled={busy||!!journey.current||blocked&&!reviewed} onClick={()=>{if(heading.current?.closest('section')?.querySelector('form')?.reportValidity())void save('later');}}>{m('later')}</button><button className="button button-primary" disabled={busy||blocked&&!reviewed}>{journey.current?m('retry'):draft.ref?t('save'):m('publish')}</button>{draft.ref&&!journey.current&&<button type="button" className="button button-primary" disabled={busy||draft.fields.pricing_model==='UNKNOWN'||blocked&&!reviewed} onClick={()=>{if(heading.current?.closest('section')?.querySelector('form')?.reportValidity())void save('available');}}>{m('publish')}</button>}<button type="button" disabled={busy} onClick={()=>void close()}>{t('cancel')}</button></div>
 </form>
 <details className="rst-menu-advanced"><summary>{m('portions')} · {m('stock')} · {m('daily')}</summary>{draft.ref?<><fieldset disabled={!!draft.changed.length||busy||!!journey.current}>{draft.fields.pricing_model==='UNIT_PRICED'&&<RestaurantCounterOptions key={draft.ref} path={path} itemRef={draft.ref} binding={binding} locale={locale} onSaved={()=>void reload()}/>}</fieldset><button type="button" disabled={busy} onClick={async()=>{if(await leaveWork())onOpen('inventory');}}>{m('stock')}</button><button type="button" disabled={busy} onClick={async()=>{if(await leaveWork())onOpen('offerings');}}>{m('daily')}</button></>:<p>{m('optionsHelp')}</p>}</details>
 </>:<>
 <div className="rst-menu-actions"><button className="button button-primary" disabled={busy||loading||failed} onClick={()=>void open()}>+ {m('add')}</button><button onClick={()=>onOpen('batch')}>{m('batch')}</button><button className="rst-menu-link" onClick={()=>onOpen('privateMenu')}>{m('public')}</button><button disabled={loading} onClick={()=>setRefresh(n=>n+1)}>{t('reload')}</button></div>
 <div className="rst-menu-filters"><label>{m('search')}<input type="search" maxLength={200} placeholder={m('search')} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label><label>{m('status')}<select value={state} onChange={e=>{setState(e.target.value);setPage(1);}}><option value="">{m('all')}</option>{['available','unavailable','hidden'].map(s=><option key={s} value={s}>{m(s as 'available'|'unavailable'|'hidden')}</option>)}</select></label></div>
 <div className="rst-menu-categories" role="group" aria-label={m('category')}><button aria-pressed={!category} onClick={()=>{setCategory('');setPage(1);}}>{m('all')}</button>{categories.map(c=><button key={c.public_ref} aria-pressed={category===c.public_ref} onClick={()=>{setCategory(c.public_ref);setPage(1);}}>{c.name}</button>)}</div>
 {failed&&<p role="alert">{m('verifyFailed')}</p>}{loading&&!data&&<p role="status">{t('loading')}</p>}
 {!loading&&!data?.result.items.length&&<p>{search||category||state?t('empty'):m('empty')}</p>}
 <div className="rst-menu-cards" aria-busy={loading}>{data?.result.items.map(row=><article className="rst-menu-card" key={row.public_ref}><div className="rst-menu-item"><div className="rst-menu-thumb"><span aria-hidden="true"><SpaceIcon name="restaurant"/></span><RestaurantPhoto src={typeof row.image_url==='string'?row.image_url:null} alt="" sizes="48px"/></div><div><h3>{row.name}</h3><p>{row.category?.name}</p></div></div><div className="rst-menu-amount"><strong>{price(row)}</strong>{!!(row.counter_options?.portions.length||row.counter_options?.extras.length)&&<details><summary>{m('portions')}</summary>{[...(row.counter_options?.portions??[]),...(row.counter_options?.extras??[])].map(option=><p key={option.key}>{option.label} · {restaurantAmount(option.amount,locale)} {String(row.currency??'')}</p>)}</details>}</div><div><span className={`rst-menu-badge ${row.menu_state==='available'?'is-available':row.menu_state==='hidden'?'is-hidden':''}`}>{failed?m('unknown'):m(row.menu_state==='available'?'available':row.menu_state==='hidden'?'hidden':'unavailable')}</span>{row.menu_state==='unpublished'&&<small>{m('unpublished')}</small>}{row.enable_blocker&&<small>{m(('blocker_'+row.enable_blocker) as MenuCopyKey)}</small>}</div><div className="rst-menu-row-actions">{row.visible!==false&&<button disabled={loading||failed||busy||row.availability!=='available'&&!!row.enable_blocker} onClick={()=>void toggle(row)}>{row.availability==='available'?m('disable'):m('enable')}</button>}<button disabled={loading||failed||busy} onClick={()=>void open(row)}>{t('edit')}</button></div></article>)}</div>
 {data&&data.result.total>20&&<nav className="rst-menu-pagination" aria-label={t('next')}><span>{m('count').replace('{start}',String((page-1)*20+1)).replace('{end}',String(Math.min(page*20,data.result.total))).replace('{total}',String(data.result.total))}</span><button disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}>{t('previous')}</button><button disabled={page*20>=data.result.total||loading} onClick={()=>setPage(p=>p+1)}>{t('next')}</button></nav>}
 <footer><button className="rst-menu-link" onClick={()=>onOpen('categories')}>{t('categories')}</button><p>{m('statesHelp')}</p></footer>
 </>}
 </section>;
}
