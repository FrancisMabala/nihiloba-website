"use client";
import {useLayoutEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {useWenzeApi,DashboardApiError} from '@/app/lib/wenze-seller-api';
import {useWorkDraft,leaveWork} from '@/app/lib/wenze-work';
import {wenzeCopy,type WenzeLocale} from '@/app/lib/wenze-copy';
import {creationText} from '@/app/lib/wenze-creation';
import {savedText,stockRows,axesFor,type SavedProduct,type SavedOption} from '@/app/lib/wenze-saved';
import choices from '@/app/lib/wenze-choice-copy.json';
import editorCopy from '@/app/lib/wenze-editor-copy.json';
import {suggestions} from './wenze-choice-editor';
import {useWenzeConfirm} from './wenze-confirm';

type Row=SavedOption&{key:string;fresh?:boolean;tracked:boolean;q:string;archive?:boolean;error?:string;conflict?:boolean;gone?:boolean};
const from=(v:SavedOption):Row=>({...v,key:v.public_ref,tracked:v.available_stock!=null,q:String(v.available_stock??'')});
const desired=(r:Row)=>r.tracked?Number(r.q):null;
const dirty=(r:Row)=>r.fresh||r.archive||desired(r)!==r.available_stock||r.tracked&&r.q==='';
const norm=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
export function SavedStock({initialFocus="",locale,product,path,onDone,onUpdate,onConvert}:{initialFocus?:string;locale:WenzeLocale;product:SavedProduct;path:string;onDone:()=>void;onUpdate:(p:SavedProduct)=>void;onConvert:()=>void}){
 const t=savedText.bind(null,locale),c=choices[locale],v=wenzeCopy[locale],ec=editorCopy[locale];
 const {request}=useWenzeApi(),{confirm,confirmation}=useWenzeConfirm(locale);
 const [rows,setRows]=useState(()=>stockRows(product).map(from)),[busy,setBusy]=useState(false),lock=useRef(false),latest=useRef(product);
 const [adding,setAdding]=useState(false),[draft,setDraft]=useState<Record<string,string>>({}),[message,setMessage]=useState(''),[highlight,setHighlight]=useState(initialFocus);
 const [rename,setRename]=useState(''),[newLabel,setNewLabel]=useState('');
 const fields=useRef(new Map<string,HTMLInputElement>()),changed=rows.some(dirty);
 useWorkDraft(changed||busy,'');
 useLayoutEffect(()=>{const el=fields.current.get(highlight);if(el){el.focus({preventScroll:true});if(el.getBoundingClientRect().bottom>innerHeight-70||el.getBoundingClientRect().top<0)el.scrollIntoView({block:'center'});}},[highlight]);
 const mounted=useRef(true);
 useLayoutEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 const axes=axesFor(rows),primary=axes[0]??suggestions(product.category)[0],addAxes=axes.length?axes:suggestions(product.category).slice(0,2);
 const attr=(k:string)=>c[k as keyof typeof c]??k;
 function patch(key:string,change:Partial<Row>){setRows(old=>old.map(r=>r.key===key?{...r,...change}:r));}
 const invalid=rows.some(r=>!r.archive&&r.tracked&&(!/^\d+$/.test(r.q)||!Number.isSafeInteger(Number(r.q))||Number(r.q)>2147483647));
 function add(){
  const attrs=Object.fromEntries(addAxes.filter(k=>draft[k]?.trim()).map(k=>[k,draft[k].trim()]));
  if(!attrs[primary])return;
  const label=Object.values(attrs).join(' / ');
  if(rows.length>=20||rows.some(r=>norm(r.label)===norm(label))||(product.variants??[]).some(r=>norm(r.label)===norm(label))){setMessage(creationText(locale,rows.length>=20?'limit':'duplicate'));return;}
  const key=crypto.randomUUID();setRows(old=>[...old,{...from({public_ref:'',label,option_attributes:attrs,available_stock:null,committed_quantity:0,is_available:'yes'}),key,fresh:true,tracked:true}]);
  setAdding(false);setHighlight(key);setMessage(primary==='size'?creationText(locale,'sizeAdded',{value:attrs[primary]}):t('added'));
 }
 function current(p:SavedProduct,r:Row){return stockRows(p).find(v=>r.fresh?norm(v.label)===norm(r.label):v.public_ref===r.public_ref);}
 async function read(){const p=await request(path) as SavedProduct;if(mounted.current){latest.current=p;onUpdate(p);}return p;}
 function confirmed(key:string,target:SavedOption|undefined){setRows(old=>target?old.map(r=>r.key===key?from(target):r):old.filter(r=>r.key!==key));}
 async function recover(r:Row,uncertain:boolean){
  try{const p=await read(),now=current(p,r);
   if(uncertain&&((r.archive&&!now)||(!r.archive&&now&&now.available_stock===desired(r)))){confirmed(r.key,now);return true;}
   if(r.fresh&&now){patch(r.key,{error:creationText(locale,'duplicate'),gone:true});return;}
   if(!r.fresh&&!now){patch(r.key,{error:t('failed'),gone:true});return;}
   if(now&&now.available_stock!==r.available_stock){patch(r.key,{conflict:true,available_stock:now.available_stock,committed_quantity:now.committed_quantity,error:t('conflict',now.available_stock??v.untracked)});return;}
   patch(r.key,{error:t('failed')});
  }catch{patch(r.key,{error:t('failed')});}
 }
 async function editOption(action:'rename'|'reactivate',ref:string,label?:string){
  if(lock.current||changed)return;lock.current=true;setBusy(true);
  try{const next=await request(path+'/variants',{method:'POST',body:JSON.stringify({action,variant_ref:ref,label,expected_revision:latest.current.revision})}) as SavedProduct;
   latest.current=next;onUpdate(next);setRows(stockRows(next).map(from));setRename('');setMessage('');
  }catch{setMessage(t('failed'));try{const now=await read();setRows(stockRows(now).map(from));}catch{}}
  finally{lock.current=false;setBusy(false);}
 }
 async function save(){
  if(lock.current||invalid)return;lock.current=true;setBusy(true);
  try{
   let snapshot=await read();
   for(const row of rows.filter(dirty)){
    if(!mounted.current)return;
    const actual=current(snapshot,row);
    if((row.fresh&&actual)||(!row.fresh&&(!actual||row.available_stock!==actual.available_stock))){await recover(row,false);return;}
    const isVariant=!!product.variant_type,variant=isVariant?row.public_ref:undefined;
    const action=row.fresh||row.archive?'variants':'stock';
    const body=row.fresh?{action:'add',label:row.label,option_attributes:row.option_attributes,available_quantity:desired(row)}:row.archive?{action:'archive',variant_ref:variant}:{variant_ref:variant,observed:{available:row.available_stock},available_quantity:desired(row)};
    try{
     const next=await request(path+'/'+action,{method:action==='stock'?'PUT':'POST',headers:{'Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({...body,expected_revision:snapshot.revision})}) as SavedProduct;
     if(!mounted.current)return;
     snapshot=next;latest.current=next;onUpdate(next);confirmed(row.key,current(next,row));
    }catch(err){
     if(!mounted.current)return;
     if(await recover(row,!(err instanceof DashboardApiError)||err.status>=500)){snapshot=latest.current;continue;}
     if(err instanceof DashboardApiError&&err.detail?.includes('reconciliation'))patch(row.key,{error:c.reconcile});
     else if(err instanceof DashboardApiError&&err.detail?.includes('obligation'))patch(row.key,{error:c.active});
     return;
    }
   }
   if(mounted.current)onDone();
  }catch{setMessage(t('failed'));}finally{lock.current=false;setBusy(false);}
 }
 const total=rows.filter(r=>!r.archive).reduce((n,r)=>n+(r.tracked?Number(r.q)||0:0),0);
 return <div className="wd-editor">{confirmation}<button disabled={busy} className="wd-back" onClick={()=>void leaveWork().then(ok=>{if(ok)onDone();})}>← {t('backProduct')}</button><h1>{t('editStock')}</h1><div className="wd-product-line">{product.photos?.[0]&&<Image unoptimized src={product.photos[0].url} width={90} height={96} alt=""/>}<h2>{product.name}</h2></div>
 <fieldset className="wc-card" disabled={busy}><legend className="wz-visually-hidden">{t('editStock')}</legend><h3>{rows.some(r=>!r.tracked&&!r.archive)?v.untracked:t('count',total)}</h3><table className="wd-stock-table"><thead><tr>{axes.length?axes.map(k=><th key={k}>{attr(k)}</th>):<th>{t('version')}</th>}<th>{t('saleable')}</th><th>{t('reserved')}</th><th/></tr></thead><tbody>{rows.map(r=><tr key={r.key} data-new={highlight===r.key} data-archived={r.archive}>
 {axes.length?axes.map((k,i)=><td key={k} data-label={attr(k)}>{r.option_attributes?.[k]??(!i&&!r.option_attributes?r.label:'—')}</td>):<td>{r.label}</td>}
 <td data-label={t('saleable')}><input type="number" min="0" step="1" aria-label={t('saleable')+' · '+r.label} ref={el=>{if(el)fields.current.set(r.key,el);else fields.current.delete(r.key);}} value={r.q} disabled={!r.tracked||!!r.archive} onChange={e=>patch(r.key,{q:e.target.value})}/>{!r.tracked&&<small>{v.untracked}</small>}
 {r.error&&<div role="alert">{r.error}{r.conflict&&<button type="button" onClick={()=>patch(r.key,{error:'',conflict:false})}>{t('useMine')}</button>}{(r.conflict||r.gone)&&<button onClick={()=>confirmed(r.key,current(latest.current,r))}>{t('useSaved')}</button>}</div>}{r.archive&&<small>{t('reviewArchive')}</small>}</td>
 <td data-label={t('forOrders')}>{r.committed_quantity}</td><td><details className="wd-menu"><summary aria-label={ec.more+' · '+r.label}>•••</summary><div>{r.archive?<button onClick={()=>patch(r.key,{archive:false})}>{t('undo')}</button>:<>
 <button onClick={()=>patch(r.key,{tracked:true,q:'0'})}>{v.soldOut}</button><button onClick={()=>r.tracked?void confirm(v.untracked,t('untrackHelp'),async()=>patch(r.key,{tracked:false,q:''})):patch(r.key,{tracked:true,q:'0'})}>{r.tracked?v.untracked:v.tracked}</button>
 {r.fresh?<button onClick={()=>setRows(old=>old.filter(x=>x.key!==r.key))}>{t('removeRow')}</button>:product.variant_type&&<><button disabled={changed} onClick={()=>{setRename(r.key);setNewLabel(r.label);}}>{v.edit}</button><button onClick={()=>void confirm(v.archive,t('archiveHelp'),async()=>patch(r.key,{archive:true}))}>{v.archive}</button></>}</>}</div></details>
 {rename===r.key&&<div><label>{c.choice}<input value={newLabel} onChange={e=>setNewLabel(e.target.value)}/></label><button onClick={()=>void editOption('rename',r.public_ref,newLabel)}>{v.save}</button></div>}</td></tr>)}</tbody></table>
 <p role="status">{message}</p>{product.variant_type&&<><button type="button" onClick={()=>{setDraft(Object.fromEntries(addAxes.map((k,i)=>[k,i&&new Set(rows.map(r=>r.option_attributes?.[k])).size===1?rows[0]?.option_attributes?.[k]??'':''])));setAdding(!adding);}}>＋ {primary==='size'?t('addSizeColour'):t('addChoice')}</button>{adding&&<div className="wd-add">{addAxes.map(k=><label key={k}>{attr(k)}<input maxLength={40} list={'wd-values-'+k} value={draft[k]??''} onChange={e=>setDraft({...draft,[k]:e.target.value})}/><datalist id={'wd-values-'+k}>{Array.from(new Set(rows.map(r=>r.option_attributes?.[k]).filter(Boolean))).map(v=><option key={v} value={v}/>)}</datalist></label>)}<button disabled={!draft[primary]?.trim()} onClick={add}>{primary==='size'?creationText(locale,'addSize'):t('addChoice')}</button></div>}</>}
 <details className="wd-advanced"><summary>{ec.more}</summary><button disabled={changed} onClick={onConvert}>{product.variant_type?ec.removeChoices:ec.addChoices}</button>{product.variants?.filter(v=>v.is_available!=="yes").map(row=><button key={row.public_ref} disabled={changed} onClick={()=>void editOption("reactivate",row.public_ref)}>{v.reactivate} · {row.label}</button>)}</details>
 <footer><button onClick={()=>void leaveWork().then(ok=>{if(ok)onDone();})}>{v.cancel}</button><button className="seller-primary" disabled={invalid||rows.some(r=>r.conflict||r.gone)||!changed} onClick={()=>void save()}>{t('save')}</button></footer></fieldset></div>;
}
