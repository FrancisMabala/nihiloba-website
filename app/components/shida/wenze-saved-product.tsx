"use client";
import Image from 'next/image';
import {useEffect,useState,type ReactNode} from 'react';
import {creationMoney,creationText} from '@/app/lib/wenze-creation';
import {savedText,stockRows,axesFor,type SavedProduct} from '@/app/lib/wenze-saved';
import {inventoryCatalogue} from '@/app/lib/wenze-inventory-catalogue';
import {posText} from '@/app/lib/wenze-pos-copy';
import {wenzeCopy,type WenzeLocale} from '@/app/lib/wenze-copy';
import choices from '@/app/lib/wenze-choice-copy.json';
import editorCopy from '@/app/lib/wenze-editor-copy.json';
import {useWenzeApi,DashboardApiError} from '@/app/lib/wenze-seller-api';
import {ShopIcon} from './wenze-shop-icons';

type Cost={target_ref:string;unit_cost:string|null;currency:string|null;configured:boolean};
type CostResult={target:string;cost?:Cost;failed?:boolean};

function SavedPrices({locale,product,path,pending,retry,onLabels}:{locale:WenzeLocale;product:SavedProduct;path:string;pending:boolean;retry:()=>Promise<void>;onLabels:()=>void}){
 const {request}=useWenzeApi();
 const [selected,setSelected]=useState(''),[result,setResult]=useState<CostResult>(),[attempt,setAttempt]=useState(0),[retrying,setRetrying]=useState(false);
 const rows=stockRows(product),target=rows.find(row=>row.public_ref===selected)?.public_ref??rows[0]?.public_ref;
 const variants=!!product.variant_type,t=savedText.bind(null,locale),ct=creationText.bind(null,locale);
 useEffect(()=>{
   let active=true;
   async function load(){
     if(!target)return;
     try{
       const plan=await request(path.split('/products/')[0]+'/plan') as {plan:string};
       if(!active)return;
       if(plan.plan!=='pro'){setResult({target});return;}
       const cost=await request(path+'/private-cost'+(variants?'?variant_ref='+encodeURIComponent(target):'')) as Cost;
       if(active)setResult({target,cost:cost.target_ref===target&&typeof cost.configured==='boolean'?cost:undefined});
     }catch(err){
       if(active)setResult({target,failed:!(err instanceof DashboardApiError&&[401,403,404].includes(err.status))});
     }
   }
   void load();return()=>{active=false;};
 },[request,path,target,variants,attempt,pending]);
 const current=result?.target===target?result:undefined,cost=current?.cost;
 const configured=cost?.configured&&cost.unit_cost!=null&&cost.currency;
 const money=(value:string|number)=>creationMoney(locale,value,product.currency??'');
 return <section className="wz-card wd-prices">
   <h3><ShopIcon name="lock"/> {ct('prices')}</h3>
   {rows.length>1&&<label>{t('version')}<select value={target} onChange={event=>setSelected(event.target.value)}>{rows.map(row=><option key={row.public_ref} value={row.public_ref}>{row.label}</option>)}</select></label>}
   <dl><div><dt>{ct('sale')}</dt><dd>{product.price!=null?money(product.price):'—'}</dd></div>
   {configured&&<><div><dt>{t('unitCost')}</dt><dd>{creationMoney(locale,cost.unit_cost!,cost.currency!)}</dd></div>
   {cost.currency===product.currency&&product.price!=null&&<div><dt>{t('beforeExpenses')}</dt><dd><output>{money(Number(product.price)-Number(cost.unit_cost))}</output></dd></div>}</>}</dl>
   {cost&&!configured&&!pending&&<p>{t('noCost')}</p>}
   {pending&&cost&&<><p>{ct('pending')}</p><button disabled={retrying} onClick={async()=>{setRetrying(true);try{await retry();}finally{setRetrying(false);}}}>{ct('retryCost')}</button></>}
   {current?.failed&&<><p>{t('unavailableCost')}</p><button onClick={()=>setAttempt(n=>n+1)}>{t('retry')}</button></>}
   <button className="wd-link wd-label-entry" onClick={onLabels}>{posText(locale,'labels')}</button>
 </section>;
}

export function SavedProductPage({product:p,locale,path,category,pending,retry,actions,onBack,onEdit,onStock,onLabels,onShare,onPhotos}:{product:SavedProduct;locale:WenzeLocale;path:string;category:string;pending:boolean;retry:()=>Promise<void>;actions:ReactNode;onBack:()=>void;onEdit:()=>void;onStock:()=>void;onLabels:()=>void;onShare:()=>void;onPhotos:()=>void}){
 const t=savedText.bind(null,locale),ct=creationText.bind(null,locale),v=wenzeCopy[locale],e=editorCopy[locale],c=choices[locale];
 const {lines}=inventoryCatalogue([p],[])[0],axes=axesFor(stockRows(p)),photo=p.photos?.[0],status=p.status!=='active'?'archived':p.visible==='true'?'active':'hidden';
 const count=p.available_stock==null?v.untracked:t('count',p.available_stock);
 const axisName=(key:string)=>c[key as keyof typeof c]??key;
 return <div className="wd-details">
   <button className="wd-back" onClick={onBack}>← {t('backList')}</button>
   <section className="wd-hero">
     <div className="wd-cover">{photo?<Image unoptimized src={photo.url} alt={p.name} width={128} height={146}/>:<span className="wz-photo-fallback">{p.name.slice(0,1)}</span>}
       <button className="wd-link" onClick={onPhotos}>{t('viewPhotos')}</button></div>
     <div><h2>{p.name}</h2><div className="wd-price"><strong>{p.price!=null?creationMoney(locale,p.price,p.currency??''):'—'}</strong><span className="wp-publication" data-state={status}>{v[status]}</span><span>{count}</span></div>
       <p>{[category,p.condition&&(v[p.condition as keyof typeof v]??p.condition),t(p.price_negotiable==='yes'?'negotiable':'fixed')].filter(Boolean).join(' · ')}</p>
       <div className="wd-actions">{p.status==='active'&&<button className="seller-primary" onClick={onEdit}><ShopIcon name="pen"/> {t('editProduct')}</button>}<button onClick={onShare}><ShopIcon name="share"/> {e.share}</button>
       <details className="wd-menu"><summary>••• {e.more}</summary><div><button onClick={onPhotos}>{t('managePhotos')}</button>{actions}</div></details></div>
       {p.description&&<details className="wd-description"><summary>{v.description}</summary><p>{p.description}</p></details>}
     </div>
   </section>
   <div className="wd-columns"><section className="wz-card"><div className="wc-between"><h3>{ct('stock')}</h3>{p.status==='active'&&<button className="wd-link" onClick={onStock}>{t('editStock')}</button>}</div>
     <strong>{count}</strong><table className="wd-stock-table"><thead><tr>{p.variant_type&&(axes.length?axes.map(k=><th key={k}>{axisName(k)}</th>):<th>{t('version')}</th>)}<th>{t('available')}</th><th>{t('reserved')}</th></tr></thead>
     <tbody>{lines.map(row=><tr key={row.target}>{p.variant_type&&(axes.length?axes.map((key,index)=><td key={key}>{row.attributes[key]??(!index&&!Object.keys(row.attributes).length?row.option:'—')}</td>):<td>{row.option}</td>)}<td>{row.available??v.untracked}</td><td>{row.reserved??'—'}</td></tr>)}</tbody></table>
   </section><SavedPrices product={p} path={path} locale={locale} pending={pending} retry={retry} onLabels={onLabels}/></div>
 </div>;
}
