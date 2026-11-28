"use client";
import Image from "next/image";
import {useEffect,useMemo,useRef,useState,type ReactNode} from "react";
import {useWenzeApi,DashboardApiError} from "@/app/lib/wenze-seller-api";
import {sellerText} from "@/app/lib/wenze-seller-copy";
import {individualSellingCopy} from "@/app/lib/individual-selling-copy";
import {quickSellCopy} from "@/app/lib/quick-sell-copy";
import type {WenzeLocale} from "@/app/lib/wenze-copy";
import {useWorkDraft,WenzeLeaveDialog,leaveWork} from "@/app/lib/wenze-work";
import {useConfirmation} from "./confirmation-dialog";
import {listingCopy,articleListingCopy} from "@/app/lib/wenze-listings-copy";
import {WenzeListingPhotos} from "./wenze-listing-photos";
import {SpaceIcon} from "./account-space-icon";
import {listingWorkspaceCopy} from "@/app/lib/listing-workspace-copy";
import {collectListingPages} from "@/app/lib/individual-listing-pages";
import {QuickListingCard} from "./quick-listing-card";
import {draftUX} from "@/app/lib/draft-ux-copy";
import "./quick-sell.css";
import {personalSpaceMobileCopy} from "../../lib/personal-space-mobile-copy";
import {QuickListingActions} from "./quick-listing-actions";
import {articleFilters,matchesArticleFilter,readArticleFilter,type ArticleFilter} from "@/app/lib/quick-sell-listing";

type SellingTerms={city?:string;commune?:string;area?:string;address?:string;public_address_confirmed?:boolean;fulfillment_mode?:string;payment_methods?:string[];delivery_areas?:string[];delivery_fee_type?:string;delivery_fee?:string;delivery_currency?:string};
type Store={public_ref:string;revision:number;city:string;commune:string|null;quartier:string|null;address:string|null;fulfillment_mode:string|null;delivery_fee_type:string|null;delivery_fee:string|null;delivery_currency:string|null;delivery_areas:string[];order_ready:boolean;name:string};
type Item={individual_terms?:SellingTerms|null;sale_provenance?:"shida_completed"|"seller_reported"|"unknown";quick_sell_state?:string;public_ref:string;revision:number;name:string;category:string;condition:string;description:string;price:string;currency:string;price_negotiable:string;visible:string;status:string;available_stock:number|null;committed_quantity:number;photos:{photo_ref:string;url:string}[]};
type Fields={name:string;category:string;condition:string;description:string;price:string;currency:string;price_negotiable:string};
const blank:Fields={name:"",category:"",condition:"used",description:"",price:"",currency:"CDF",price_negotiable:"no"};
const root="wenze/contexts/personal",enc=encodeURIComponent;
const bytes=(file:File)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.readAsDataURL(file);});

export function QuickSell({locale,embedded=false,onInventoryLoaded,heading,categoriesNav}:{locale:WenzeLocale;embedded?:boolean;onInventoryLoaded?:(total:number)=>void;heading?:ReactNode;categoriesNav?:ReactNode}){
 const a=articleListingCopy[locale],mobile=personalSpaceMobileCopy[locale],w=listingWorkspaceCopy[locale],d=draftUX[locale],c=individualSellingCopy[locale],l=listingCopy[locale],t=quickSellCopy[locale],{request}=useWenzeApi(),{request:confirm,confirmation}=useConfirmation(locale);
 const [store,setStore]=useState<Store|null>(null),[city,setCity]=useState(""),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [categories,setCategories]=useState<{code:string;labels:Record<WenzeLocale,string>}[]>([]),[items,setItems]=useState<Item[]>([]),[offset,setOffset]=useState(()=>{if(typeof window==='undefined')return 0;return Math.max(0,Number(new URLSearchParams(location.search).get('article_page'))||0)*20;}),[quota,setQuota]=useState<{active_products:number;active_product_limit:number}|null>(null);
 const [view,setView]=useState<"list"|"edit">("list"),[step,setStep]=useState(0),[fields,setFields]=useState<Fields>(blank),[editing,setEditing]=useState<Item|null>(null),[draft,setDraft]=useState<{draft_ref:string;revision:number}|null>(null),[photos,setPhotos]=useState<{ref:string;url:string}[]>([]);
 const [mode,setMode]=useState("pickup"),[commune,setCommune]=useState(""),[quartier,setQuartier]=useState(""),[point,setPoint]=useState(""),[consent,setConsent]=useState(false),[areas,setAreas]=useState(""),[feeType,setFeeType]=useState("free"),[fee,setFee]=useState(""),[feeCurrency,setFeeCurrency]=useState("CDF");

 const [payments,setPayments]=useState<string[]>([]),[confirmed,setConfirmed]=useState(false);
 const [uncertain,setUncertain]=useState(false);
 const [filter,setFilter]=useState(()=>readArticleFilter(typeof window==='undefined'?null:new URLSearchParams(location.search).get('article_status'))),[photoItem,setPhotoItem]=useState<Item|null>(null);
 type SavedDraft={draft_ref:string;revision:number;fields:Fields;photos:{ref:string;url:string}[];step?:number;updated_at?:string;selling_terms?:SellingTerms};
 const [drafts,setDrafts]=useState<SavedDraft[]>([]);
 const stepHeading=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{if(view==="edit")stepHeading.current?.focus();},[step,view]);
 const alive=useRef(true),lock=useRef(false),urls=useRef<string[]>([]),publication=useRef<Record<string,unknown>|null>(null);
 const storePath=`${root}/stores/${enc(store?.public_ref??"")}`;
 const [baseline,setBaseline]=useState<string|null>(null);
 const currentSnapshot=JSON.stringify({fields,photos:photos.map(p=>p.ref),terms:editing?null:sellingTerms()});
 useEffect(()=>{if(view==="edit"&&baseline===null)setBaseline(currentSnapshot);},[view,baseline,currentSnapshot]);
 const dirty=view==="edit"&&baseline!==null&&baseline!==currentSnapshot;useWorkDraft(dirty,t.cancel);
 const link=(path:string)=>`${locale==="en"?"":`/${locale}`}/shida/${path}`;
 const send=(path:string,body:unknown,method="POST")=>request(path,{method,body:JSON.stringify(body)});
 function hydrate(s:Store){setStore(s);setCity(s.city);setMode(s.fulfillment_mode??"pickup");setCommune(s.commune??"");setQuartier(s.quartier??"");setPoint(s.address??"");setAreas((s.delivery_areas??[]).join("\n"));setFeeType(s.delivery_fee_type??"free");setFee(s.delivery_fee??"");setFeeCurrency(s.delivery_currency??"CDF");setConsent(false);}
 async function load(s=store,page=offset){if(!s)return;const base=`${root}/stores/${enc(s.public_ref)}`;
 const [products,saved,plan]=await Promise.all([
 collectListingPages<Item>(async offset=>{const data=await request(`${base}/products?status=all&listing_state=all&offset=${offset}&limit=100`) as {products:Item[];next_offset?:number|null};return {rows:data.products,next_offset:data.next_offset};},()=>alive.current),
 collectListingPages<SavedDraft>(async offset=>{const data=await request(`${base}/quick-sell-drafts?offset=${offset}&limit=100`) as {drafts:SavedDraft[];next_offset?:number|null};return {rows:data.drafts,next_offset:data.next_offset};},()=>alive.current),
 request(`${base}/plan`) as Promise<{active_products:number;active_product_limit:number}>
 ]);if(alive.current){setItems(products);setDrafts(saved);setOffset(page);setQuota(plan);onInventoryLoaded?.(products.length+saved.length);}}
 async function guard(work:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);setNotice("");try{await work();}catch(error){if(alive.current)setNotice(error instanceof DashboardApiError&&error.detail==="wenze_plan_product_limit"?`${t.quota}: ${quota?.active_products??""} / ${quota?.active_product_limit??""}`:error instanceof DashboardApiError&&error.status===409?t.conflict:t.failed);}finally{lock.current=false;if(alive.current)setBusy(false);}}
 useEffect(()=>{alive.current=true;void guard(async()=>{const [context,options]=await Promise.all([request(`${root}/quick-sell`),request(`${root}/stores`)]) as [{store:Store|null},{stores?:{public_ref:string;name:string;selling_mode?:string}[];product_categories:{code:string;labels:Record<WenzeLocale,string>}[]}];if(!alive.current)return;setCategories(options.product_categories);if(context.store){hydrate(context.store);await load(context.store);}else onInventoryLoaded?.(0);setLoaded(true);});return()=>{alive.current=false;urls.current.forEach(URL.revokeObjectURL);};},[]); // eslint-disable-line react-hooks/exhaustive-deps
 function restoreTerms(value:SellingTerms={}){setCity(value.city??"");setCommune(value.commune??"");setQuartier(value.area??"");setPoint(value.address??"");setMode(value.fulfillment_mode??"pickup");setConsent(value.public_address_confirmed===true);setAreas((value.delivery_areas??[]).join("\n"));setFeeType(value.delivery_fee_type??"free");setFee(value.delivery_fee??"");setFeeCurrency(value.delivery_currency??"CDF");setPayments(value.payment_methods??[]);setConfirmed(false);}
 function sellingTerms():SellingTerms{return {city,commune,area:quartier,fulfillment_mode:mode,payment_methods:payments,public_address_confirmed:mode!=="delivery"&&consent,...(mode!=="delivery"?{address:point}:{}),...(mode!=="pickup"?{delivery_areas:areas.split("\n").map(v=>v.trim()).filter(Boolean),delivery_fee_type:feeType,delivery_currency:feeCurrency,...(feeType==="fixed"&&fee?{delivery_fee:fee}:{})}:{})};}
 async function saveProgress(nextStep=step){if(!draft)return;const saved=await send(`${storePath}/quick-sell-drafts/${enc(draft.draft_ref)}`,{expected_revision:draft.revision,fields,upload_refs:photos.map(p=>p.ref),step:nextStep,selling_terms:sellingTerms()},"PUT") as {draft_ref:string;revision:number};if(alive.current){setDraft(saved);setBaseline(currentSnapshot);}}
 async function advance(nextStep:number){await guard(async()=>{await saveProgress(nextStep);if(alive.current){setStep(nextStep);setConfirmed(false);}});}
 async function start(){await guard(async()=>{const current=store??await send(`${root}/quick-sell`,{}) as Store;const value=await send(`${root}/stores/${enc(current.public_ref)}/drafts`,{}) as {draft_ref:string;revision:number};if(!alive.current)return;setStore(current);setDraft(value);setBaseline(null);setEditing(null);setFields(blank);setPhotos([]);restoreTerms();setStep(0);setView("edit");setUncertain(false);publication.current=null;});}
 function change(key:keyof Fields,value:string){setFields(old=>({...old,[key]:value}));}
 async function upload(files:FileList|null){if(!files||!draft)return;const selected=Array.from(files);if(photos.length+selected.length>5||selected.some(file=>file.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))){setNotice(t.uploadHelp);return;}await guard(async()=>{for(const file of selected){const value=await send(`${storePath}/uploads`,{target_type:"product_draft",target_ref:draft.draft_ref,content_base64:await bytes(file)}) as {upload_ref:string};if(!alive.current)return;const url=URL.createObjectURL(file);urls.current.push(url);setPhotos(old=>[...old,{ref:value.upload_ref,url}]);}});}
 async function publish(){if(!store||!draft||!confirmed)return;await guard(async()=>{publication.current??={...fields,individual_terms:sellingTerms(),mode:"detailed",...draft,expected_revision:draft.revision,stock_quantity:1,upload_refs:photos.map(p=>p.ref)};const payload={...publication.current};delete payload.revision;try{await send(`${storePath}/products`,payload);}catch(error){if(alive.current)setUncertain(!(error instanceof DashboardApiError)||error.status>=500);if(error instanceof DashboardApiError&&error.status<500)publication.current=null;throw error;}if(!alive.current)return;setUncertain(false);listView();setDraft(null);publication.current=null;setNotice(`${t.published}. ${t.publishedHelp}`);await load();});}
 function action(item:Item,kind:string,returnFocus:()=>HTMLElement|null){
  const title=kind==="sold"?t.sold:kind==="archive"?l.archive:kind==="restore"?l.restore:kind==="hide"?t.hide:t.show;
  const path=`${storePath}/products/${enc(item.public_ref)}/${kind==="sold"?"sold":`lifecycle/${kind}`}`;
  const body={expected_revision:item.revision};let completed=false;
  confirm({title,returnFocus,description:kind==="sold"?t.soldHelp:item.name,confirmLabel:title,severity:kind==="archive"?"warning":"normal",errorMessage:error=>error instanceof DashboardApiError&&error.status===409?t.conflict:t.failed,onConfirm:async()=>{
   if(lock.current)throw new Error("busy");lock.current=true;setBusy(true);
   try{if(!completed){await send(path,body);completed=true;}await load();}finally{lock.current=false;if(alive.current)setBusy(false);}
  }});
 }
 function editItem(item:Item){
  setBaseline(null);setDraft(null);setEditing(item);
  setFields({name:item.name,category:item.category,condition:item.condition||"used",description:item.description||"",price:item.price,currency:item.currency,price_negotiable:item.price_negotiable});
  setView("edit");setStep(0);
 }
 function resumeDraft(saved:SavedDraft){
  setBaseline(null);setDraft({draft_ref:saved.draft_ref,revision:saved.revision});
  setFields({...blank,...saved.fields});setPhotos(saved.photos);restoreTerms(saved.selling_terms);
  setEditing(null);setStep(saved.step??0);setView("edit");setUncertain(false);publication.current=null;
 }
 function removeDraft(saved:SavedDraft,returnFocus:()=>HTMLElement|null){
  const path=`${storePath}/quick-sell-drafts/${enc(saved.draft_ref)}`,body={expected_revision:saved.revision};let completed=false;
  confirm({title:d.remove,returnFocus,description:d.removeHelp,confirmLabel:d.deleteDraft,cancelLabel:d.retainDraft,compactHeading:true,severity:"danger",errorMessage:error=>error instanceof DashboardApiError&&error.status===409?t.conflict:t.failed,onConfirm:async()=>{
   if(lock.current)throw new Error("busy");lock.current=true;setBusy(true);
   try{if(!completed){await send(path,body,"DELETE");completed=true;}await load(store,0);}finally{lock.current=false;if(alive.current)setBusy(false);}
  }});
 }
 const filterLabels:Record<ArticleFilter,string>={all:l.all,available:a.online,drafts:l.drafts,pending:l.pending,sold:a.sold,unpublished:a.hidden,unavailable:a.unavailable,archived:a.archived};
 const {counts,productsByFilter}=useMemo(()=>{
  const productsByFilter:Record<ArticleFilter,Item[]>={all:items,available:[],drafts:[],pending:[],sold:[],unpublished:[],unavailable:[],archived:[]};
  const counts:Record<ArticleFilter,number>={all:items.length+drafts.length,drafts:drafts.length,available:0,sold:0,archived:0,unpublished:0,pending:0,unavailable:0};
  for(const key of articleFilters){
   if(key==='all'||key==='drafts')continue;
   const matched=items.filter(item=>matchesArticleFilter(item,key));
   productsByFilter[key]=matched;
   counts[key]=matched.length;
  }
  return {counts,productsByFilter};
 },[items,drafts.length]);
 const filterLabel=(key:ArticleFilter)=>`${filterLabels[key]} (${counts[key]})`;
 const collection=[...(filter==="all"||filter==="drafts"?drafts.map(value=>({kind:"draft" as const,value})):[]),...productsByFilter[filter].map(value=>({kind:"item" as const,value}))];
 const pageOffset=Math.min(offset,Math.max(0,Math.floor((collection.length-1)/20)*20));
 const visible=collection.slice(pageOffset,pageOffset+20),visibleDrafts=visible.flatMap(row=>row.kind==="draft"?[row.value]:[]),visibleItems=visible.flatMap(row=>row.kind==="item"?[row.value]:[]);
 const routed=useRef(false);
 useEffect(()=>{if(!loaded||routed.current||!embedded)return;const target=new URLSearchParams(window.location.search).get('item');if(!target)return;routed.current=true;
 if(target==='new'){void start();return}
 const saved=drafts.find(d=>d.draft_ref===target);if(saved){resumeDraft(saved);return;}
 const item=items.find(r=>r.public_ref===target);if(item){
  setFilter('all');setOffset(Math.floor((drafts.length+items.indexOf(item))/20)*20);
  requestAnimationFrame(()=>{
   const target=document.getElementById('article-'+item.public_ref);
   target?.focus({preventScroll:true});target?.scrollIntoView({block:'center'});
  });
 }
 },[loaded,items,drafts,embedded]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const sync=()=>{const q=new URLSearchParams(location.search);setFilter(readArticleFilter(q.get('article_status')));setOffset(Math.max(0,Number(q.get('article_page'))||0)*20);};window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)},[]);
 function rememberList(){history.replaceState({...history.state,shidaArticles:{path:location.pathname+location.search,scrollY:scrollY}},'');}
 useEffect(()=>{if(!loaded||view!=='list')return;const saved=history.state?.shidaArticles;if(saved?.path===location.pathname+location.search){const id=requestAnimationFrame(()=>scrollTo(0,Number(saved.scrollY)||0));return()=>cancelAnimationFrame(id);}},[loaded,view,filter,offset,items.length,drafts.length]);
 function selectPage(page:number,key=filter){rememberList();const url=new URL(location.href);url.searchParams.delete('item');url.searchParams.set('article_status',key);url.searchParams.set('article_page',String(page/20));history.pushState({...history.state,shidaArticles:null},'',url);setFilter(key);setOffset(page);}
 const selectFilter=(key:ArticleFilter)=>selectPage(0,key);
 function listView(nextFilter=filter){const url=new URL(location.href);url.searchParams.delete('item');url.searchParams.set('article_status',nextFilter);setFilter(nextFilter);history.replaceState({...history.state},'',url);setView('list');}

 const input=(key:keyof Fields,label:string,required=false,type="text")=><label><span>{label}</span><input name={key} placeholder={key==="name"?t.name:undefined} value={fields[key]} required={required} type={type} maxLength={key==="name"?200:40} min={type==="number"?"0":undefined} step={type==="number"?"0.01":undefined} onChange={e=>change(key,e.target.value)}/></label>;
 const selects=<><label htmlFor="qs-category"><span>{t.category}</span><select id="qs-category" required value={fields.category} onChange={e=>change("category",e.target.value)}><option value="">—</option>{categories.map(c=><option key={c.code} value={c.code}>{c.labels[locale]}</option>)}</select></label><label htmlFor="qs-condition"><span>{t.condition}</span><select id="qs-condition" value={fields.condition} onChange={e=>change("condition",e.target.value)}>{(["new","like_new","used","other"] as const).map(c=><option key={c} value={c}>{t[c]}</option>)}</select></label></>;
 const createAction=<button className="button button-primary qs-create" type="button" aria-label={t.title} disabled={busy||!loaded} onClick={()=>void start()}><span aria-hidden="true">＋ </span>{t.title}</button>;
 return <section className={`qs container${embedded?" qs-embedded":""}`} lang={locale} onClickCapture={event=>{if(view==='list'&&(event.target as HTMLElement).closest('a'))rememberList();}}><WenzeLeaveDialog locale={locale} onSave={view==="edit"&&!editing?async()=>{if(busy||uncertain)throw new Error("busy");await saveProgress();await load(store,0);setFilter("drafts");}:undefined}/>{confirmation}{!embedded&&<header><p className="qs-eyebrow">WENZE · {t.individual}</p><h1>{view==="edit"?t.title:l.title}</h1><p>{t.intro}</p><nav><a href={link("wenze")} onClick={async e=>{e.preventDefault();if(await leaveWork())window.location.assign(link("wenze"));}}>Wenze</a><a href={link("space")} onClick={async e=>{e.preventDefault();if(await leaveWork())window.location.assign(link("space"));}}>{({en:"My Space",fr:"Mon espace",ln:"Esika na ngai",sw:"Nafasi yangu"})[locale]}</a><a href={link("seller/wenze")} onClick={async e=>{e.preventDefault();if(await leaveWork())window.location.assign(link("seller/wenze"));}}>{t.shop}</a></nav></header>}

 {embedded&&heading&&<header className="qs-embedded-heading">{heading}{view==='list'&&createAction}</header>}
 {categoriesNav}

 <p className="qs-status" role="status" aria-live="polite">{busy?t.loading:notice}</p>
 {!loaded?<button disabled={busy} onClick={()=>window.location.reload()}>{t.retry}</button>:<>
 {photoItem&&<WenzeListingPhotos key={photoItem.public_ref} item={photoItem} base={storePath} locale={locale} onClose={()=>{setPhotoItem(null);void guard(()=>load());}}/>}
 {view==="list"?<section className="qs-workspace">
 {(!embedded||!heading)&&createAction}
 <nav className="qs-tabs qs-primary-filters" aria-label={a.filter}>{articleFilters.map(key=><button type="button" key={key} aria-pressed={filter===key} disabled={busy} onClick={()=>selectFilter(key)}>{filterLabel(key)}</button>)}</nav>
 <label className="qs-filter-select">{a.filter}<select value={filter} disabled={busy} onChange={event=>selectFilter(readArticleFilter(event.currentTarget.value))}>{articleFilters.map(key=><option key={key} value={key}>{filterLabel(key)}</option>)}</select></label>
 <div className="qs-workspace-columns"><div className="qs-workspace-results">
 {!collection.length&&<section className="qs-empty"><SpaceIcon name="orders"/><h3>{counts.all===0?mobile.empty:mobile.noMatches}</h3><p>{counts.all===0?mobile.emptyHelp:filter==='drafts'?l.draftHelp:''}</p>{filter!=='all'&&<button onClick={()=>selectFilter('all')}>{mobile.reset}</button>}</section>}
 {visibleDrafts.map(saved=>{
  const name=saved.fields.name||d.untitled,draftStep=Math.max(0,Math.min(3,saved.step??0));
  return <article className="qs-draft-card" key={saved.draft_ref}>
   {saved.photos[0]?<Image unoptimized className="qs-draft-photo" src={saved.photos[0].url} alt="" width={72} height={72}/>:<span className="qs-draft-icon"><SpaceIcon name="orders"/></span>}
   <div className="qs-draft-content"><h3>{name}</h3><span className="qs-listing-state qs-state-unpublished">{a.draft}</span>
    <p>{t.step} {draftStep+1} {t.of} 4 · {c.steps[draftStep]}</p>
    <progress aria-label={t.step} value={draftStep+1} max={4}/>
    {saved.updated_at&&<p>{d.modified} {new Date(saved.updated_at).toLocaleString(locale==='ln'?'fr':locale,{dateStyle:"medium",timeStyle:"short"})}</p>}
   </div>
   <div className="qs-draft-controls"><button type="button" className="button button-primary qs-manage" disabled={busy} onClick={()=>resumeDraft(saved)}>{w.continue}</button>
    <QuickListingActions locale={locale} name={name}>{(close,returnFocus)=><button type="button" className="qs-context-warning" disabled={busy} onClick={()=>{close();removeDraft(saved,returnFocus);}}>{w.remove}</button>}</QuickListingActions>
   </div>
  </article>;
 })}
 <div className="qs-grid">{visibleItems.map(item=><div key={item.public_ref} id={"article-"+item.public_ref} tabIndex={-1}>
  <QuickListingCard item={item} locale={locale} busy={busy}
   location={[item.individual_terms?.city??store?.city,item.individual_terms?.commune??store?.commune].filter(Boolean).join(", ")}
   href={link(`wenze/${locale==='fr'?'produits':'products'}/${enc(item.public_ref)}`)}
   onManage={()=>editItem(item)} onAction={(kind,returnFocus)=>action(item,kind,returnFocus)} onPhotos={()=>setPhotoItem(item)}/>
 </div>)}</div>
 {(pageOffset>0||pageOffset+20<collection.length)&&<div className="qs-actions"><button disabled={busy||pageOffset===0} onClick={()=>selectPage(Math.max(0,pageOffset-20))}>{t.back}</button><button disabled={busy||pageOffset+20>=collection.length} onClick={()=>selectPage(pageOffset+20)}>{t.next}</button></div>}

 </div><aside className="qs-supporting"><a className="qs-orders-link" href={link("space?view=transactions&role=seller")}><SpaceIcon name="orders"/>{mobile.sales} →</a><details className="qs-advice"><summary><SpaceIcon name="shield"/>{w.tips}</summary><ul>{w.advice.map(tip=><li key={tip}><SpaceIcon name="check"/>{tip}</li>)}</ul><p>{l.draftHelp}</p>{quota&&<p>{t.quota}: {quota.active_products} / {quota.active_product_limit}</p>}<button disabled={busy} onClick={()=>void guard(()=>load())}>{t.retry}</button></details>
 </aside></div></section>:<section>
 {embedded&&<h2 className="qs-wizard-title">{t.title}</h2>}<p ref={stepHeading} tabIndex={-1}>{t.step} {step+1} {t.of} {editing?1:4}</p>{!editing&&<ol className="qs-progress">{c.steps.map((label,index)=><li key={label} aria-current={index===step?"step":undefined}><span>{index+1}</span>{label}</li>)}</ol>}
 {step===0&&<form onSubmit={e=>{e.preventDefault();if(editing){void guard(async()=>{await send(`${storePath}/products/${enc(editing.public_ref)}`,{expected_revision:editing.revision,fields},"PATCH");if(alive.current){listView();setEditing(null);await load();setNotice(t.saved);}});}else if(photos.length)void advance(1);else setNotice(t.uploadHelp);}}><fieldset disabled={busy||uncertain}><legend>{t.details}</legend>{!editing&&<><label className="qs-photo-upload"><span aria-hidden="true">＋</span>{d.photos}<input className="qs-file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy||photos.length>=5} onChange={e=>{void upload(e.target.files);e.target.value="";}}/></label><p>{t.uploadHelp}</p><div className="qs-photos">{photos.map((photo,index)=><div key={photo.ref}><Image unoptimized src={photo.url} width={180} height={150} alt={`${t.photos} ${index+1}`}/>{index===0&&<strong className="qs-photo-cover">{d.cover}</strong>}<button type="button" onClick={()=>setPhotos(old=>old.filter(p=>p.ref!==photo.ref))}>{t.remove}</button><button type="button" disabled={!index} onClick={()=>setPhotos(old=>{const next=[...old];[next[index-1],next[index]]=[next[index],next[index-1]];return next;})}>{t.earlier}</button></div>)}</div><p>{t.one}</p></>}<div className="qs-fields">{input("name",t.name,true)}{selects}{editing&&<>{input("price",t.price,true,"number")}<label> {sellerText(locale,"currency")}<select value={fields.currency} onChange={e=>change("currency",e.target.value)}><option>CDF</option><option>USD</option></select></label><label className="qs-check"><input type="checkbox" checked={fields.price_negotiable==="yes"} onChange={e=>change("price_negotiable",e.target.checked?"yes":"no")}/>{t.negotiable}</label></>}</div><label htmlFor="qs-description">{t.description}<textarea id="qs-description" maxLength={4000} value={fields.description} onChange={e=>change("description",e.target.value)}/><small>{t.sizeHelp}</small></label><button className="button button-primary">{editing?t.save:t.next}</button></fieldset></form>}
 {step===1&&<form onSubmit={e=>{e.preventDefault();if(!payments.length){setNotice(c.payments);return;}void advance(2);}}><fieldset disabled={busy||uncertain}><legend>{c.steps[1]}</legend><div className="qs-fields">{input("price",t.price,true,"number")}<label> {sellerText(locale,"currency")}<select value={fields.currency} onChange={e=>change("currency",e.target.value)}><option>CDF</option><option>USD</option></select></label><label className="qs-check"><input type="checkbox" checked={fields.price_negotiable==="yes"} onChange={e=>change("price_negotiable",e.target.checked?"yes":"no")}/>{t.negotiable}</label></div><h3>{c.payments}</h3>{(["cash","mobile_money","other"] as const).map(method=><label className="qs-check" key={method}><input type="checkbox" checked={payments.includes(method)} onChange={e=>setPayments(old=>e.target.checked?[...old,method]:old.filter(item=>item!==method))}/>{c[method]}</label>)}<p>{c.paymentHelp}</p><button className="button button-primary">{t.next}</button></fieldset></form>}
 {step===2&&<form onSubmit={e=>{e.preventDefault();void advance(3);}}><fieldset disabled={busy}><legend>{t.fulfillment}</legend><p>{c.locationHelp}</p><label>{t.city}<input required maxLength={120} value={city} onChange={e=>setCity(e.target.value)}/></label><label htmlFor="qs-fulfillment">{t.fulfillment}<select id="qs-fulfillment" value={mode} onChange={e=>setMode(e.target.value)}><option value="pickup">{t.pickup}</option><option value="delivery">{t.delivery}</option><option value="pickup_and_delivery">{t.both}</option></select></label><div className="qs-fields"><label>{t.commune}<input required={city.trim().toLowerCase()==="kinshasa"&&mode!=="delivery"} maxLength={120} value={commune} onChange={e=>setCommune(e.target.value)}/></label><label>{t.quartier}<input maxLength={120} value={quartier} onChange={e=>setQuartier(e.target.value)}/></label></div>{mode!=="delivery"&&<><label>{t.point}<input required maxLength={500} value={point} onChange={e=>setPoint(e.target.value)}/></label><label className="qs-check"><input required type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>{t.publicPoint}</label></>}{mode!=="pickup"&&<><label htmlFor="qs-areas">{t.areas}<textarea id="qs-areas" required maxLength={2000} value={areas} onChange={e=>setAreas(e.target.value)}/></label><label htmlFor="qs-fee-type">{t.fee}<select id="qs-fee-type" value={feeType} onChange={e=>setFeeType(e.target.value)}><option value="free">{t.free}</option><option value="fixed">{t.fixed}</option></select></label>{feeType==="fixed"&&<div className="qs-fields"><label>{t.fee}<input required type="number" min="0" step="0.01" value={fee} onChange={e=>setFee(e.target.value)}/></label><label>{sellerText(locale,"currency")}<select value={feeCurrency} onChange={e=>setFeeCurrency(e.target.value)}><option>CDF</option><option>USD</option></select></label></div>}</>}<button className="button button-primary">{t.save} · {t.next}</button></fieldset></form>}
 {step===3&&<section className="qs-preview"><h2>{t.review}</h2><div className="qs-photos">{photos.map(p=><Image unoptimized key={p.ref} src={p.url} width={250} height={200} alt={fields.name}/>)}</div><h3>{fields.name}</h3><p>{fields.price} {fields.currency} · {fields.price_negotiable==="yes"?t.negotiable:({en:"Fixed price",fr:"Prix fixe",ln:"Ntalo etyami",sw:"Bei maalumu"})[locale]}</p><p>{categories.find(c=>c.code===fields.category)?.labels[locale]} · {t[fields.condition as "used"]}</p><p>{fields.description}</p><p>{t.individual} · {city} · {commune} · {quartier}</p><p>{mode==="pickup"?t.pickup:mode==="delivery"?t.delivery:t.both}</p>{mode!=="delivery"&&point&&<p>{t.point}: {point}</p>}{mode!=="pickup"&&<p>{feeType==="free"?t.free:`${fee} ${feeCurrency}`} · {areas.split("\n").join(", ")}</p>}<p>{c.payments}: {payments.map(method=>c[method as "cash"|"mobile_money"|"other"]).join(", ")}</p><p>{c.paymentHelp}</p><label className="qs-check"><input type="checkbox" checked={confirmed} disabled={busy||uncertain} onChange={e=>setConfirmed(e.target.checked)}/>{c.confirm}</label><p>{t.one}. {t.private}</p><button className="button button-primary" disabled={busy||!confirmed} onClick={()=>void publish()}>{t.publish}</button></section>}
 <div className="qs-actions">{!editing&&draft&&<button disabled={busy||uncertain} onClick={()=>void guard(async()=>{await saveProgress();if(alive.current){listView("drafts");await load(store,0);setNotice(t.saved);}})}>{l.saveDraft}</button>}{step>0&&<button disabled={busy||uncertain} onClick={()=>setStep(step-1)}>{t.back}</button>}<button disabled={busy||uncertain} onClick={async()=>{if(await leaveWork()){listView();setEditing(null);}}}>{t.cancel}</button></div>
 </section>}</>}
 </section>;
}
