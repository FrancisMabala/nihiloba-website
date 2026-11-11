"use client";
import {useLayoutEffect,useRef,useState} from 'react';
import {type ChoiceRow,presets,colours,suggestions} from './wenze-choice-editor';
import {productText} from '@/app/lib/wenze-products-copy';
import copy from '@/app/lib/wenze-choice-copy.json';
import {creationText} from '@/app/lib/wenze-creation';
import type {WenzeLocale} from '@/app/lib/wenze-copy';

const norm=(s:string)=>s.normalize('NFKC').trim().toLocaleLowerCase();
function identity(a:Record<string,string>){return JSON.stringify(Object.entries(a).sort().map(([k,v])=>[k,norm(v)]));}
export function CreationStock({locale,category,rows,multiple,onMode,quantity,onQuantity,onRows}:{locale:WenzeLocale;category:string;rows:ChoiceRow[];multiple:boolean;onMode:(multi:boolean)=>void;quantity:string;onQuantity:(q:string)=>void;onRows:(rows:ChoiceRow[],type:string)=>void}){
 const c=copy[locale],t=creationText.bind(null,locale),attr=(k:string)=>c[k as keyof typeof c]??k;
 const suggested=suggestions(category),[primary,setPrimary]=useState(Object.keys(rows[0]?.attributes??{})[0]??suggested[0]);
 const [extra,setExtra]=useState<string[]>([]),[context,setContext]=useState<Record<string,string>>(()=>({...rows.at(-1)?.attributes})),[draft,setDraft]=useState<Record<string,string>>({}),[msg,setMsg]=useState(''),[lit,setLit]=useState('');
 const [focusTarget,setFocusTarget]=useState<{label:string}|null>(null);
 const inputs=useRef(new Map<string,HTMLInputElement>());
 useLayoutEffect(()=>{
  const field=focusTarget&&inputs.current.get(focusTarget.label);if(!field)return;
  field.focus({preventScroll:true});
  const bounds=field.getBoundingClientRect(),reserved=window.matchMedia('(max-width:760px)').matches?70:0;
  if(bounds.top<0||bounds.bottom>window.innerHeight-reserved)field.scrollIntoView({block:'center'});
 },[focusTarget]);
 const axes=Array.from(new Set([primary,...suggested,...extra,...rows.flatMap(r=>Object.keys(r.attributes??{}))]));
 const options=(k:string)=>Array.from(new Set([...(k==='colour'?colours[locale]:presets[k]??[]),...rows.map(r=>r.attributes?.[k]??''),context[k]??''].filter(Boolean)));
 function update(next:ChoiceRow[]){const keys=new Set(next.flatMap(r=>Object.keys(r.attributes??{})));const k=[...keys][0];onRows(next,keys.size===1&&['size','shoe_size','storage','volume'].includes(k)?k:'option');}
 function put(a:Record<string,string>,index=-1){const id=identity(a),dupe=rows.findIndex(r=>identity(r.attributes??{})===id);
  if(dupe>=0&&dupe!==index){setMsg(t('duplicate'));focus(rows[dupe].label);return;}
  if(index<0&&rows.length>=20){setMsg(t('limit'));return;}
  const label=Object.values(a).join(' / ');const next={attributes:a,label,quantity:index<0?'':rows[index].quantity};
  update(index<0?[...rows,next]:rows.map((r,i)=>i===index?next:r));focus(label);
 }
 function focus(label:string){setLit(label);setFocusTarget({label});}
 function choose(k:string,v:string){setMsg('');const clean=v.trim();if(!clean)return;
  const value=options(k).find(x=>norm(x)===norm(clean))??clean;
  const next={...context,[k]:value};setContext(next);setDraft({...draft,[k]:''});
  if(k!==primary && !next[primary]){setMsg(t('pair')+' · '+value);return;}
  const attrs=Object.fromEntries(axes.filter(key=>next[key]).map(key=>[key,next[key]]));
  if(Object.keys(attrs).length>3){setMsg(c.invalid);return;}
  setMsg(k==='size'?t('sizeAdded',{value}):t('added',{attr:attr(k),value}));
  // Choosing a first secondary value completes the selected, previously unpaired row.
  const incomplete=k!==primary?rows.findIndex(r=>r.attributes?.[primary]===next[primary]&&!r.attributes?.[k]&&Object.entries(r.attributes??{}).every(([key,val])=>attrs[key]===val)):-1;
  put(attrs,incomplete);
 }
 const mode=<div className="wc-mode">{[false,true].map(v=><button key={String(v)} type="button" aria-pressed={multiple===v} onClick={()=>onMode(v)}>{t(v?'multi':'single')}</button>)}</div>;
 if(!multiple)return <div className="wc-card">{mode}<h3>{t('stock')}</h3><p>{productText(locale,'simpleHelp')}</p><label>{t('quantity')}<input type="number" min="0" step="1" value={quantity} onChange={e=>onQuantity(e.target.value)}/></label></div>;
 return <div className="wc-grid wc-stock"><div className="wc-card">{axes.map(k=><div className="wc-axis" key={k}><h3>{k==='size'?t('sizes'):k==='colour'?t('colours'):attr(k)}</h3><div className="wc-chips">{options(k).map(value=>{const selected=rows.some(r=>r.attributes?.[k]===value);return <button key={value} type="button" aria-pressed={context[k]===value} data-selected={selected} onClick={()=>choose(k,value)}>{selected&&<span aria-hidden="true">✓ </span>}{value}</button>;})}</div>
 <label>{t(k==='size'?'missSize':k==='colour'?'missColour':'missAttr',{attr:attr(k)})}<span className="wc-inline"><input maxLength={40} value={draft[k]??''} placeholder={k==='size'?'4XL':undefined} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();choose(k,draft[k]??'');}}} onChange={e=>setDraft({...draft,[k]:e.target.value})}/><button type="button" disabled={!draft[k]?.trim()} onClick={()=>choose(k,draft[k])}>{t(k==='size'?'addSize':k==='colour'?'addColour':'addAttr',{attr:attr(k)})}</button></span></label></div>)}
 <details><summary>{c.otherOptions}</summary>{mode}{rows.length>0&&<label>{t('pair')}<select value={context[primary]??''} onChange={e=>setContext({...context,[primary]:e.target.value})}><option value="">—</option>{options(primary).map(v=><option key={v}>{v}</option>)}</select></label>}<label>{c.choice}<select value={primary} disabled={rows.length>0} onChange={e=>{setPrimary(e.target.value);setContext({});}}>{Object.keys(presets).map(k=><option key={k} value={k}>{attr(k)}</option>)}</select></label>
 {Object.keys(presets).filter(k=>!axes.includes(k)).map(k=><button key={k} type="button" onClick={()=>setExtra([...extra,k])}>{attr(k)}</button>)}
 {axes.filter(k=>k!==primary&&context[k]).map(k=><button type="button" key={k} onClick={()=>setContext({...context,[k]:''})}>{c.remove}: {attr(k)} · {context[k]}</button>)}</details></div>
 <div className="wc-card"><h3>{t('stock')}</h3><div className="wc-highlight">{t('total',{n:rows.reduce((n,r)=>n+Number(r.quantity||0),0)})}</div><div className="wc-tablewrap"><table><thead><tr>{axes.filter(k=>k===primary||rows.some(r=>r.attributes?.[k])||context[k]).map(k=><th key={k}>{attr(k)}</th>)}<th>{t('quantity')}</th><th/></tr></thead><tbody>{rows.map((r,i)=><tr key={r.label} className={lit===r.label?'wc-new':''}>{axes.filter(k=>k===primary||rows.some(r=>r.attributes?.[k])||context[k]).map(k=><td key={k}>{k===primary?r.attributes?.[k]:<select aria-label={attr(k)+' · '+r.label} value={r.attributes?.[k]??''} onChange={e=>{const a={...r.attributes};if(e.target.value)a[k]=e.target.value;else delete a[k];put(a,i);}}><option value="">—</option>{options(k).map(v=><option key={v}>{v}</option>)}</select>}</td>)}<td><input ref={el=>{if(el)inputs.current.set(r.label,el);else inputs.current.delete(r.label);}} aria-label={t('quantity')+' · '+r.label} type="number" min="0" step="1" required value={r.quantity} onChange={e=>update(rows.map((row,j)=>i===j?{...row,quantity:e.target.value}:row))}/></td><td><button type="button" className="wc-remove" aria-label={c.remove+' · '+r.label} onClick={()=>{update(rows.filter((_,j)=>i!==j));setMsg('');}}>×</button></td></tr>)}</tbody></table></div><p role="status">{msg}</p></div></div>;
}
