import {SpaceIcon} from './account-space-icon';
import {missionText} from '../../lib/mission-copy';
import type {ReactNode} from 'react';
import {listingText as copy,type MissionLocale} from '../../lib/personal-missions-copy';
export function MissionPresentation({locale,title,location,description,frequency,hours,pay,experience,actions,heading=false}:{locale:MissionLocale;title:string;location?:string|null;description?:string|null;frequency?:string|null;hours?:string|null;pay?:string|null;experience?:string|null;actions?:ReactNode;heading?:boolean}){
 const [condition,...date]=(frequency||'').split(' · ');
 const formatted=date.map(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'))?new Intl.DateTimeFormat(locale,{dateStyle:'full',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z')):d);
 const amount=pay?.replace(/^(\d+(?:[.,]\d+)?) (?=(USD|CDF)\b)/,(_,n:string)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(Number(n.replace(',','.')))+' ');
 const rows=[[missionText(locale,'frequency'),condition],[missionText(locale,'daysLabel'),formatted.join(' · ')],[missionText(locale,'hours'),hours],[missionText(locale,'payLabel'),amount],[missionText(locale,'experienceLabel'),experience]].filter(([,value])=>value);
 return <div className="personal-mission">{title&&<header>{heading?<h1 className="mission-heading"><SpaceIcon name="home"/>{title}</h1>:<h3>{title}</h3>}{location&&<p>{location}</p>}</header>}{actions}
 {description&&<section><h2>{copy(locale,'mission')}</h2><p className="mission-description">{description}</p></section>}
 {rows.length>0&&<section><h2>{copy(locale,'terms')}</h2><dl className="mission-terms">{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>}</div>
}
