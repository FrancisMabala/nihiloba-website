"use client";
import {useState,type ReactNode} from 'react';
import {docWords,lineAmount,itemTotal,cents,money,type DocumentFields,type DocumentItem,type Paper} from '../../lib/service-document';
import type {ProviderLocale} from '../../lib/services-provider-copy';
import {DocumentPaper} from './service-document-paper';

export function DocumentEditor({paper,locale,change,amount,currency,children,locked=false,agreedDescription=false}:{paper:Paper;locale:ProviderLocale;change:(d:DocumentFields)=>void;amount:(v:string)=>void;currency:(v:string)=>void;children?:ReactNode;locked?:boolean;agreedDescription?:boolean}){
 const [preview,setPreview]=useState(false),t=docWords(locale),d=paper.document;
 const items=d.items||[],itemised=items.length>0;
 function updateItems(next:DocumentItem[]){change({...d,items:next});amount(itemTotal(next));}
 function text(key:Exclude<keyof DocumentFields,'items'>,label:string,max:number){return <label>{label}<textarea maxLength={max} rows={key==='description'?7:3} value={d[key]||''} readOnly={(key==='description'&&agreedDescription)||(locked&&['subject','included','excluded','timing','conditions'].includes(key))} onChange={e=>change({...d,[key]:e.target.value})}/></label>;}
 return <div className="svc-doc-editor" data-preview={preview}><nav className="svc-doc-mobile" aria-label={t.preview}><button type="button" aria-pressed={!preview} onClick={()=>setPreview(false)}>{t.write}</button><button type="button" aria-pressed={preview} onClick={()=>setPreview(true)}>{t.preview}</button></nav>
 <div className="svc-doc-fields">{children}
 {paper.kind==='quote'&&<label>{t.subject}<input value={d.subject||''} maxLength={200} onChange={e=>change({...d,subject:e.target.value})}/></label>}
 {text('description',paper.kind==='quote'?t.description:t.billDescription,12000)}
 <fieldset disabled={locked}><legend>{t.items}</legend><label>{t[paper.kind]}<select value={itemised?'items':'single'} onChange={e=>updateItems(e.target.value==='items'?[{label:d.subject||'',quantity:1,unit_price:paper.amount}]:[])}><option value="single">{t.single}</option><option value="items">{t.itemised}</option></select></label>
 <label>{t.total}<select aria-label="CDF / USD" value={paper.currency} onChange={e=>currency(e.target.value)}><option>CDF</option><option>USD</option></select></label>
 {itemised?<>{items.map((item,i)=>{function update(p:Partial<DocumentItem>){updateItems(items.map((x,n)=>n===i?{...x,...p}:x));}return <div className="svc-doc-line" key={i}><label>{t.label}<input required maxLength={120} value={item.label} onChange={e=>update({label:e.target.value})}/></label><label>{t.qty}<input type="number" required min={1} max={999999} value={item.quantity||''} onChange={e=>update({quantity:Number(e.target.value)})}/></label><label>{t.unit}<input required inputMode="decimal" pattern="[0-9]{1,14}([.,][0-9]{1,2})?" value={item.unit_price} onChange={e=>update({unit_price:e.target.value.replace(',','.')})}/></label><output>{money(lineAmount(item),locale)}</output><button type="button" aria-label={t.remove} onClick={()=>updateItems(items.filter((_,n)=>n!==i))}>×</button>{!lineAmount(item)&&<small>{t.invalid}</small>}</div>;})}<button type="button" disabled={items.length>=50} onClick={()=>updateItems([...items,{label:'',quantity:1,unit_price:''}])}>＋ {t.add}</button></>:<label>{t.amount}<input required inputMode="decimal" pattern="[0-9]{1,16}([.,][0-9]{1,2})?" value={paper.amount} onChange={e=>amount(e.target.value)}/>{paper.amount&&cents(paper.amount)===null&&<small>{t.invalid}</small>}</label>}</fieldset>
 <details open={undefined}><summary>{t.conditions}</summary>{(paper.kind==='quote'?['included','excluded','timing','conditions'] as const:['instructions'] as const).map(key=><div key={key}>{text(key,t[key],key==='instructions'||key==='timing'?2000:4000)}</div>)}</details>
 {text('private_note',t.private,2000)}</div><DocumentPaper paper={paper} locale={locale}/></div>;
}
