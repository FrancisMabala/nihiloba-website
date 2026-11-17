'use client';
import type {ReactNode} from 'react';
import {refinementCopy} from '../../lib/restaurant-refinement-copy';
import type {Establishment} from '../../lib/restaurant-seller';
import type {RestaurantLocale} from '../../services/shida/restaurants-client';
import {restaurantText} from '../../lib/restaurant-seller-copy';
import {settingsCopy} from '../../lib/restaurant-settings-copy';
import {workText} from '../../lib/restaurant-work-copy';
import './restaurant-refinements.css';
export function RestaurantProfileOverview({selected,locale,photo,onEdit,onPreview,publication}:{selected:Establishment;locale:RestaurantLocale;photo?:ReactNode;onEdit?:()=>void;onPreview?:()=>void;publication:ReactNode}){
 const c=refinementCopy[locale],t=(key:string)=>restaurantText(locale,key),p=selected.profile;
 const sections=[{title:c.presentation,values:[p.name,p.food_business_type?t(p.food_business_type):null,p.description]},{title:c.address,values:[p.country,p.city,p.commune,p.quartier,p.public_address,p.landmark,p.address_visibility?t(p.address_visibility):null]},{title:c.services,values:(typeof p.service_modes==='string'&&!p.service_modes.trim()?[c.noServices]:p.service_modes?.split(',').filter(Boolean).map(mode=>workText(locale,mode.trim().toLowerCase()==='eat_there'?'on_premise':mode.trim().toLowerCase()))??[settingsCopy[locale].unknown])}];
 return <article className="rst-card rst-profile-overview"><h2>{c.profile}</h2><header>{photo}<div><h3>{p.name}</h3><p>{p.food_business_type&&t(p.food_business_type)} · {t(selected.status)}</p></div></header><div className="rst-actions">{onPreview&&<button type="button" onClick={onPreview}>{c.preview}</button>}</div>{onPreview&&<p className="rst-field-help">{c.privatePreview}</p>}{sections.map(section=><section className="rst-profile-section" key={section.title}><h3>{section.title}</h3><div>{section.values.filter(Boolean).map((value,i)=>value&&value===p.description&&value.length>180?<details key={i}><summary>{value.slice(0,180)}… {c.viewMore}</summary><p>{value}</p></details>:<p key={i}>{value}</p>)}</div>{onEdit&&<button type="button" onClick={onEdit} aria-label={`${t('edit')} · ${section.title}`}>{t('edit')}</button>}</section>)}<details><summary>{c.publication}</summary>{publication}</details></article>;
}
