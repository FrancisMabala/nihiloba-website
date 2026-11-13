"use client";
import {useEffect,useState} from 'react';
import type {RegistrationLocale} from '../../lib/registration/copy';
import {addressCopy} from '../../lib/registration/address-copy';
import {locationCopy} from '../../lib/registration/location-copy';
import {RegistrationCommune} from "./registration-commune";
import {RegistrationQuartier} from './registration-quartier';
import './wenze-address-selector.css';
import {RegistrationCountry} from './registration-country';
export const profileLocationFields=['country_code','city','area','commune','quartier','avenue','landmark','region','postal_code','parcel_number'];
export function RegistrationLocation({values,onChange,locale,prefix,required=false}:{values:Record<string,string>;onChange:(values:Record<string,string>)=>void;locale:RegistrationLocale;prefix:string;required?:boolean}){
 const t=addressCopy[locale],kinshasa=values.country_code==='CD'&&['kinshasa','kin'].includes((values.city||'').trim().toLowerCase());
 const [optional,setOptional]=useState<string[]>([]);
 const [communes,setCommunes]=useState<string[]>([]),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 useEffect(()=>{const controller=new AbortController();void fetch('/api/shida/registration-reference/?resource=locations',{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(data=>{if(!Array.isArray(data.kinshasa_communes))throw Error();if(!controller.signal.aborted){setCommunes(data.kinshasa_communes);setOptional(data.address_config?.international_optional||[]);setFailed(false);}}).catch(()=>{if(!controller.signal.aborted)setFailed(true);});return()=>controller.abort();},[attempt]);
 function change(key:string,value:string){const next={...values,[key]:value};if(['country_code','city'].includes(key)&&value!==values[key])for(const dependent of ['commune','quartier','avenue','landmark','region','postal_code','parcel_number'])next[dependent]='';if(key==='commune'&&value!==values.commune)for(const dependent of ['quartier','avenue','landmark','parcel_number'])next[dependent]='';onChange(next);}
 const field=(key:keyof typeof t,must=false)=><div key={key}><label htmlFor={`${prefix}-${key}`}>{t[key]} <small>{must?t.required:t.optional}</small></label><input id={`${prefix}-${key}`} value={values[key]||''} required={must} maxLength={key==='postal_code'?32:['region','parcel_number'].includes(key)?100:500} onChange={event=>change(key,event.target.value)}/></div>;
 return <>
 <div><label htmlFor={`${prefix}-country_code`}>{locationCopy[locale].country} <small>{required?t.required:t.optional}</small></label><RegistrationCountry id={`${prefix}-country_code`} value={values.country_code||''} onChange={value=>change('country_code',value)} locale={locale} required={required}/></div>
 {field('city',required)}
 {kinshasa?<><div><label htmlFor={`${prefix}-commune`}>{t.commune} <small>{required?t.required:t.optional}</small></label><RegistrationCommune id={`${prefix}-commune`} required={required} locale={locale} communes={communes} value={values.commune||''} onChange={event=>change('commune',event.target.value)}/>{failed&&<p role="alert">{t.failed} <button type="button" onClick={()=>setAttempt(attempt+1)}>{t.retry}</button></p>}</div><RegistrationQuartier commune={values.commune||''} value={values.quartier||''} onChange={v=>change('quartier',v)} locale={locale}/><small className="registration-location-hint">{t.manual}</small></>:field('area')}
 <details className="registration-optional-address" open={['region','postal_code','parcel_number','avenue','landmark'].some(key=>Boolean(values[key]))}><summary>{t.more}</summary><div className="registration-section">
 {!kinshasa&&optional.filter(key=>['region','postal_code','parcel_number'].includes(key)).map(key=>field(key as keyof typeof t))}
 {field('avenue')}{field('landmark')}
 </div></details><small className="registration-address-note"><span aria-hidden="true">ⓘ</span>{t.hint}</small>
 </>;
}
