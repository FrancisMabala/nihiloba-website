"use client";
import Image from 'next/image';
import {useState} from 'react';
import {creationMoney,creationText} from '@/app/lib/wenze-creation';
import {productMargin,sellerImprovements} from '@/app/lib/wenze-seller-improvements';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
import choiceCopy from '@/app/lib/wenze-choice-copy.json';
import type {ChoiceRow} from './wenze-choice-editor';

type Pricing={locale:WenzeLocale;fields:Record<string,string>;change?:(key:string,value:string)=>void};
export function PrivatePricing({locale,fields:f,change}:Pricing){
 const t=creationText.bind(null,locale),shirt=f.category==='fashion_clothing:shirts',noun=t(shirt?'shirt':'item'),money=(n:number)=>creationMoney(locale,n,f.currency);
 const result=productMargin(f.price,f.purchase_price??'');
 return <div className="wc-private">{change?<><label>{t('cost')} <small>({t('optional')})</small><input inputMode="decimal" pattern="[0-9]{1,12}([.,][0-9]{1,2})?" value={f.purchase_price??''} onChange={e=>change('purchase_price',e.target.value)}/></label><p>{t('example',{lot:money(f.currency==='CDF'?50000:50),unit:money(f.currency==='CDF'?10000:10),plural:t(shirt?'shirts':'items'),noun})}</p></>:<p>{t('cost')} <strong>{money(Number(f.purchase_price.replace(',','.')))}</strong></p>}
 <output aria-live="polite">{result?<><span className="wc-highlight">{t(shirt?'leftShirt':'left')} <strong>{t('before',{amount:money(result.amount)})}</strong></span><span>{result.amount<0?t('loss',{amount:money(-result.amount)}):t('explain',{noun,amount:money(result.amount)})}</span></>:t('missing')}</output>{f.price_negotiable==='yes'&&<p>{t('basis')}</p>}<small>{sellerImprovements[locale].privacy}</small></div>;
}
export function CreationGallery({images,name}:{images:string[];name:string}){
 const [index,setIndex]=useState(0);return <div className="wc-gallery">{images[0]&&<Image className="wc-main-photo" unoptimized src={images[index]??images[0]} width={420} height={520} alt={name}/>}<div className="wc-thumbs">{images.map((src,i)=><button type="button" key={i} aria-pressed={index===i} aria-label={name+' · '+(i+1)} onClick={()=>setIndex(i)}><Image unoptimized src={src} width={70} height={76} alt=""/></button>)}</div></div>;
}
export function StockSummary({locale,rows,quantity,compact=false}:{locale:WenzeLocale;rows:ChoiceRow[];quantity:string;compact?:boolean}){
 const t=creationText.bind(null,locale),keys=Array.from(new Set(rows.flatMap(r=>Object.keys(r.attributes??{})))),known=rows.length?rows.every(r=>r.quantity!==''):quantity!=='';
 const name=(k:string)=>choiceCopy[locale][k as keyof typeof choiceCopy.en]??k;
 const changing=keys.filter(k=>rows.some(r=>r.attributes?.[k]!==rows[0]?.attributes?.[k]));
 const axis=changing[0]??keys[0],common=keys.filter(k=>k!==axis);
 const horizontal=compact&&rows.length>0&&!!axis&&changing.length<=1&&rows.every(r=>!!r.attributes?.[axis]);
 const total=rows.length?rows.reduce((n,r)=>n+Number(r.quantity),0):quantity;
 return <><div className={compact?'wc-saved-total':'wc-highlight'}>{known?t(horizontal?'pieces':'total',{n:total}):t('unknown')}{horizontal&&axis==='size'&&' · '+t('sizeCount',{n:rows.length})}{horizontal&&common.map(k=><span key={k}> · {rows[0].attributes?.[k]}</span>)}</div>{rows.length>0&&<div className="wc-tablewrap">{horizontal?<><h4>{t(axis==='size'?'bySize':'each')}</h4><table><thead><tr>{rows.map(r=><th key={r.label}>{r.attributes?.[axis]}</th>)}</tr></thead><tbody><tr>{rows.map(r=><td key={r.label}>{r.quantity||'—'}</td>)}</tr></tbody></table></>:<table><thead><tr>{keys.length?keys.map(k=><th key={k}>{name(k)}</th>):<th>{choiceCopy[locale].choice}</th>}<th>{t('quantity')}</th></tr></thead><tbody>{rows.map(r=><tr key={r.label}>{keys.length?keys.map(k=><td key={k}>{r.attributes?.[k]??'—'}</td>):<td>{r.label}</td>}<td>{r.quantity||'—'}</td></tr>)}</tbody></table>}</div>}</>;
}
