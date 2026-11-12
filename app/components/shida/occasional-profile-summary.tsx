import {occText,type OccLocale} from '../../lib/occasional-copy';
import {type Answers,type Mission} from '../../lib/occasional-form';

export function OccasionalSummary({answers:a,locale,compact=false,onEdit,legacy}:{
 answers:Answers;locale:OccLocale;compact?:boolean;onEdit?:(step:number)=>void;
 legacy?:Record<string,string>;
}){
 const t=(key:string)=>occText(locale,key);
 const list=(items:string[])=>new Intl.ListFormat(locale).format(items.filter(Boolean));
 const title=(m:Mission)=>m.category==='custom'?m.name:t(m.category);
 const area=legacy?.preferred_areas||list(a.communes.map(c=>[c,a.districts[c]].filter(Boolean).join(', ')));
 const location=[a.city,area].filter(Boolean).join(' · ');
 const names=legacy?.work_types||list(a.missions.map(title));
 const schedule=[list(a.days.map(t)),list(a.slots.map(t))].filter(Boolean).join(' · ')||legacy?.availability;
 const freq=list(a.frequency.map(t));
 const pay=(m:Mission)=>m.rate==='amount'?[m.amount,m.currency,t(m.unit)].join(' '):t(m.rate==='agree'?'flexible':'omit');
 function row(label:string,value?:string){return value?<div><dt>{label}</dt><dd>{value}</dd></div>:null;}
 function heading(label:string,step:number){return <header><h3>{label}</h3>{onEdit&&<button type="button" aria-label={t(step===0?'fix1':'fix2')} onClick={()=>onEdit(step)}>{t('modify')}</button>}</header>;}
 if(compact)return <div className="occ-card-summary">
   <strong>{names}</strong>
   {location&&<p>{location}</p>}{schedule&&<p>{schedule}</p>}{freq&&<p>{freq}</p>}
   {a.missions.map(m=><p key={title(m)}>{a.missions.length>1&&m.tasks.length>0&&<b>{title(m)} · </b>}{[list(m.tasks),t(m.experience)].filter(Boolean).join(' · ')}</p>)}
   {legacy?.short_experience&&<p>{legacy.short_experience}</p>}
  </div>;
 return <div className="occ-summary">
  <section>{heading(t('s1'),0)}<dl>{row(t('missionLabel'),names)}{row(t('city'),a.city)}{row(t('commune'),area)}{row(t('days'),list(a.days.map(t)))}{row(t('slots'),list(a.slots.map(t))||legacy?.availability)}{row(t('freqLabel'),freq||t('omit'))}</dl></section>
  <section>{heading(t('s2'),1)}{a.missions.map(m=><div key={title(m)}><h4>{title(m)}</h4><dl>{row(t('skills'),list(m.tasks))}{row(t('xp'),t(m.experience))}{!legacy&&row(t('rate'),pay(m))}{row(t('example'),m.example)}</dl></div>)}
  <dl>{row(t('example'),a.example)}{row(t('xp'),legacy?.short_experience)}{row(t('rate'),legacy?.expected_payment)}</dl></section>
 </div>;
}
