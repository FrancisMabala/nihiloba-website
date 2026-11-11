"use client";
import {useEffect,useState,type ReactNode} from 'react';
import {creationMoney,creationText} from '@/app/lib/wenze-creation';
import {savedText,stockRows,axesFor,type SavedProduct} from '@/app/lib/wenze-saved';
import {wenzeCopy,type WenzeLocale} from '@/app/lib/wenze-copy';
import choices from '@/app/lib/wenze-choice-copy.json';
import editorCopy from '@/app/lib/wenze-editor-copy.json';
import {useWenzeApi,DashboardApiError} from '@/app/lib/wenze-seller-api';
import {CreationGallery,PrivatePricing} from './wenze-creation-summary';
import {ShopIcon} from './wenze-shop-icons';
type Cost={target_ref:string;unit_cost:string|null;currency:string|null;configured:boolean};
function SavedPrices({locale,product:p,path,pending,retry}:{locale:WenzeLocale;product:SavedProduct;path:string;pending:boolean;retry:()=>Promise<void>}){
 const {request}=useWenzeApi(),[costs,setCosts]=useState<Cost[]|null>(null),[selected,setSelected]=useState(''),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[retrying,setRetrying]=useState(false);
 const rows=stockRows(p),refs=rows.map(r=>r.public_ref).join(','),variants=!!p.variant_type,t=savedText.bind(null,locale),ct=creationText.bind(null,locale);
 useEffect(()=>{let active=true;
 async function load(){try{const plan=await request(path.split('/products/')[0]+'/plan') as {plan:string};if(!active)return;if(plan.plan!=='pro'){setFailed(false);setCosts(null);return;}
 const values=await Promise.all(refs.split(',').filter(Boolean).map(ref=>request(path+'/private-cost'+(variants?'?variant_ref='+encodeURIComponent(ref):'')) as Promise<Cost>));if(active){setFailed(false);setCosts(values.filter(v=>typeof v.configured==='boolean'));}
 }catch(err){if(active){setCosts(null);setFailed(!(err instanceof DashboardApiError&&[401,403,404].includes(err.status)));}}}
 void load();return()=>{active=false;};},[request,path,refs,variants,attempt,pending]);
 if(!pending&&!costs?.length&&!failed)return null;
 const cost=costs?.find(v=>v.target_ref===selected)??costs?.[0];
 return <section className="wc-card wd-prices"><h3><ShopIcon name="lock"/> {ct('prices')}</h3>{pending?<><p>{ct('pending')}</p><button disabled={retrying} onClick={async()=>{setRetrying(true);try{await retry();}finally{setRetrying(false);}}}>{ct('retryCost')}</button></>:failed?<><p>{t('unavailableCost')}</p><button onClick={()=>setAttempt(x=>x+1)}>{t('retry')}</button></>:<>
 {costs&&costs.length>1&&<label>{t('version')}<select value={cost?.target_ref} onChange={e=>setSelected(e.target.value)}>{costs.map(v=><option key={v.target_ref} value={v.target_ref}>{rows.find(r=>r.public_ref===v.target_ref)?.label}</option>)}</select></label>}
 {cost?.configured&&cost.unit_cost!=null?(cost.currency===p.currency?<PrivatePricing locale={locale} fields={{price:p.price??'',purchase_price:cost.unit_cost,currency:p.currency??'',category:p.category,price_negotiable:p.price_negotiable??'no'}}/>:<p>{ct('cost')} {creationMoney(locale,cost.unit_cost,cost.currency??'')}</p>):<p>{t('noCost')}</p>}</>}</section>;
}
export function SavedProductPage({product:p,locale,path,category,pending,retry,actions,onBack,onEdit,onStock,onLabels,onShare,onPhotos}:{product:SavedProduct;locale:WenzeLocale;path:string;category:string;pending:boolean;retry:()=>Promise<void>;actions:ReactNode;onBack:()=>void;onEdit:()=>void;onStock:()=>void;onLabels:()=>void;onShare:()=>void;onPhotos:()=>void}){
 const t=savedText.bind(null,locale),ct=creationText.bind(null,locale),v=wenzeCopy[locale],e=editorCopy[locale],c=choices[locale],rows=stockRows(p),axes=axesFor(rows);
 return <div className="wd-details"><h1>{({en:'Products and stock',fr:'Produits et stock',ln:'Biloko mpe stock',sw:'Bidhaa na stock'})[locale]}</h1><button className="wd-back" onClick={onBack}>← {t('backList')}</button>
 <section className="wc-card wp-product-summary wd-hero"><CreationGallery name={p.name} images={(p.photos??[]).map(x=>x.url)}/><div><h2>{p.name}</h2><div className="wd-price"><strong>{creationMoney(locale,p.price??'',p.currency??'')}</strong><span>{t(p.price_negotiable==='yes'?'negotiable':'fixed')}</span><span>{v[p.status!=='active'?'archived':p.visible==='true'?'active':'hidden']}</span></div><p>{[category,p.condition&&v[p.condition as keyof typeof v]].filter(Boolean).join(' · ')}</p><p>{p.description}</p>
 <div className="wd-actions">{p.status==='active'&&<button className="seller-primary" onClick={onEdit}><ShopIcon name="pen"/> {t('editProduct')}</button>}<button onClick={onShare}><ShopIcon name="share"/> {e.share}</button><details className="wd-menu"><summary>••• {e.more}</summary><div><button onClick={onPhotos}>{t('managePhotos')}</button>{actions}</div></details></div></div></section>
 <div className="wd-columns"><section className="wc-card"><h3>{ct('stock')}</h3><div className="wc-between"><strong>{p.available_stock==null?v.untracked:t('count',p.available_stock)}</strong>{p.status==='active'&&<button className="wc-link" onClick={onStock}>{t('editStock')}</button>}</div>{p.variant_type?<table className="wd-stock-table"><thead><tr>{axes.length?axes.map(k=><th key={k}>{c[k as keyof typeof c]??k}</th>):<th>{t('version')}</th>}<th>{t('available')}</th><th>{t('reserved')}</th></tr></thead><tbody>{rows.map(r=><tr key={r.public_ref}>{axes.length?axes.map((k,i)=><td key={k} data-label={c[k as keyof typeof c]}>{r.option_attributes?.[k]??(!i&&!r.option_attributes?r.label:'—')}</td>):<td>{r.label}</td>}<td data-label={t('saleable')}>{r.available_stock??v.untracked}</td><td data-label={t('forOrders')}>{r.committed_quantity}</td></tr>)}</tbody></table>:<p>{t('forOrders')} : {p.committed_quantity??0}</p>}</section>
 <aside><SavedPrices locale={locale} product={p} path={path} pending={pending} retry={retry}/><button className="wc-label-entry" onClick={onLabels}><ShopIcon name="printer"/> {t('printLabels')}</button></aside></div></div>;
}
