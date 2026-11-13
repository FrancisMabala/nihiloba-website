"use client";

import {useState} from 'react';
import Image from 'next/image';
import {inventoryCatalogue,matchesStock,type Balance,type StockFilter,type StockLine} from '@/app/lib/wenze-inventory-catalogue';
import {todayText} from '@/app/lib/wenze-today-copy';
import type {SavedProduct} from '@/app/lib/wenze-saved';
import {savedText} from '@/app/lib/wenze-saved';
import {creationText} from '@/app/lib/wenze-creation';
import copy from '@/app/lib/wenze-stock-language.json';
import attributes from '@/app/lib/wenze-choice-copy.json';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
import {ShopIcon} from './wenze-shop-icons';

export function stockWords(locale:WenzeLocale,key:keyof typeof copy.fr,values:Record<string,string|number>={}){
  return copy[locale][key].replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??''));
}

export function InventoryCatalogue({products,balances,locale,onEdit,onCreate}:{products:SavedProduct[];balances:Balance[];locale:WenzeLocale;onEdit:(ref:string,option?:string)=>void;onCreate:()=>void}){
  const t=stockWords.bind(null,locale);
  const [search,setSearch]=useState(()=>new URLSearchParams(typeof window==='undefined'?'':location.search).get('stockSearch')??'');
  const filters:StockFilter[]=['all','available','low','out'];
  const initialFilter=typeof window==='undefined'?'':new URLSearchParams(location.search).get('stockFilter');
  if(initialFilter==='untracked'||initialFilter==='uninitialized')filters.push(initialFilter);
  const [filter,setFilter]=useState<StockFilter>(()=>filters.find(f=>f===new URLSearchParams(typeof window==='undefined'?'':location.search).get('stockFilter'))??'all');
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  function remember(key:string,value:string){
    const url=new URL(location.href);
    if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);
    history.replaceState(null,'',url);
  }
  const all=inventoryCatalogue(products,balances);
  const needle=search.trim().toLocaleLowerCase(locale);
  const searched=all.filter(({product,lines})=>[product.name,...lines.flatMap(l=>[l.option,l.operational_code??''])].some(value=>value.toLocaleLowerCase(locale).includes(needle)));
  const visible=searched.filter(g=>matchesStock(g,filter));
  function axis(key:string){return attributes[locale][key as keyof typeof attributes.fr]??key;}
  function shortOption(line:StockLine,lines:StockLine[]){
    const size=line.attributes.size;
    return size && lines.filter(l=>l.attributes.size===size).length===1?axis('size')+' '+size:line.option;
  }
  return <><div className="wi-search">
    <label><ShopIcon name="search"/><input aria-label={t('search')} placeholder={t('search')} type="search" value={search} onChange={event=>{setSearch(event.target.value);remember('stockSearch',event.target.value);}}/></label>
    <div className="wi-filters">{filters.map(f=><button key={f} aria-pressed={filter===f} onClick={()=>{setFilter(f);setExpanded({});remember('stockFilter',f);}}>{f==='untracked'||f==='uninitialized'?todayText(locale,f):t(f)} · {searched.filter(g=>matchesStock(g,f)).length}</button>)}</div>
  </div>
  {all.length===0?<div className="wc-card"><h2>{t('welcome')}</h2><p>{t('firstEmpty')}</p><button className="seller-primary" onClick={onCreate}>{creationText(locale,'first')}</button></div>:
    !visible.length?<p role="status">{t(filter==='out'&&!search?'noOut':'empty')}</p>:
    <section className="wi-list"><div className="wi-columns wi-head">{(['product','onhand','reserved','sellable','state'] as const).map(key=><strong key={key}>{t(key)}</strong>)}</div>
    {visible.map(group=>{
      const {product,lines}=group;
      const keys=Array.from(new Set(lines.flatMap(l=>Object.keys(l.attributes))));
      const different=keys.filter(k=>new Set(lines.map(l=>l.attributes[k])).size>1);
      const dimension=different.length===1?different[0]:keys.length===1?keys[0]:null;
      const hasVariants=Boolean(product.variant_type && lines.length);
      const isOpen=expanded[product.public_ref]??(filter==='out'||filter==='low');
      const state=group.available===0?'out':group.low.length?'low':group.canSell?'available':'untracked';
      const warnings=group.available===0?[]:[...group.out,...group.low].filter(l=>l.option);
      const edit=(line?:StockLine)=>onEdit(product.public_ref,line?.target);
      return <article key={product.public_ref} className="wi-product" data-expanded={hasVariants&&isOpen}><div className="wi-columns">
        <div className="wi-identity">{product.photos?.[0]?<Image unoptimized src={product.photos[0].url} alt="" width={120} height={118}/>:<span className="wi-placeholder"><ShopIcon name="stock"/></span>}
          <div><h2>{product.name}</h2>{warnings.map(line=><p className={line.available===0?'wi-out':'wi-low'} key={line.target}>{t(line.available===0?'soldOption':'lowOption',{option:shortOption(line,lines),n:line.available??''})}</p>)}
          {hasVariants&&<button className="wi-link" aria-expanded={isOpen} onClick={()=>setExpanded({...expanded,[product.public_ref]:!isOpen})}>{isOpen?'▴':'▾'} {lines.length===1?t('singleVariant'):t(dimension==='size'||dimension==='shoe_size'?'sizes':dimension==='colour'||dimension==='color'?'colours':dimension==='volume'||dimension==='pack'||dimension==='weight'?'formats':'options',{n:lines.length})}</button>}</div></div>
        <div className="wi-metric"><small>{t('onhand')}</small>{group.on_hand??'—'}</div><div className="wi-metric"><small>{t('reserved')}</small>{group.reserved??'—'}</div>
        <div className="wi-metric wi-sellable"><small>{t('sellable')}</small><strong>{group.available??'—'}</strong></div>
        <div className="wi-state"><span data-state={state}>{state==='out'?'⊖':state==='low'?'⚠':state==='available'?'✓':'—'} {state==='low'&&lines.length===1?t('lowHint',{n:group.available??''}):t(state)}</span><button className="wi-link" onClick={()=>edit()}>{savedText(locale,'editStock')}</button></div>
      </div>
      {hasVariants&&isOpen&&<div className="wi-versions"><table><thead><tr>{keys.length?keys.map(k=><th key={k}>{axis(k)}</th>):<th>{savedText(locale,'version')}</th>}{(['onhand','reserved','sellable'] as const).map(k=><th key={k}>{t(k)}</th>)}</tr></thead><tbody>{lines.map(line=><tr key={line.target} data-match={filter==='out'&&line.available===0||filter==='low'&&group.low.includes(line)}>
        {(keys.length?keys:['']).map((k,i)=><td key={k} data-label={k?axis(k):savedText(locale,'version')}>{i===0?<button className="wi-link" aria-label={savedText(locale,'editStock')+' · '+line.option} onClick={()=>edit(line)}>{line.attributes[k]??line.option}</button>:line.attributes[k]??'—'}</td>)}
        <td data-label={t('onhand')}>{line.on_hand??'—'}</td><td data-label={t('reserved')}>{line.reserved??'—'}</td><td data-label={t('sellable')}><b>{line.available??'—'}</b></td>
      </tr>)}</tbody></table></div>}</article>;
    })}</section>}</>;
}
