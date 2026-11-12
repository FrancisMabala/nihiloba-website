'use client';
import {useState, type ReactNode} from 'react';
import {candidateCopy} from '../../lib/candidate-profile-copy';
import {occText,type OccLocale} from '../../lib/occasional-copy';
import {candidateMissions,workCities,weekdays,slots,suggestions,newMission,toggle,initial,problem,validText,normalized,type Answers,type Mission} from '../../lib/occasional-form';
import {CandidateSelector} from './candidate-selector';
import {OccasionalSummary} from './occasional-profile-summary';
import './occasional-wizard.css';
type Props={locale:OccLocale;values:Record<string,string>;communes:string[];editing:boolean;pending:boolean;busy:boolean;change:(raw:string)=>void;onSave:()=>void;onFinish:()=>void};
export function OccasionalWizard({locale,values,communes,editing,pending,busy,change,onSave,onFinish}:Props){
 const t=(s:string)=>occText(locale,s), common=candidateCopy[locale];
 const a=initial(values,communes), title=(m:Mission)=>m.category==='custom'?m.name:t(m.category);
 const [step,setStep]=useState(()=>values.occasional_answers&&!editing?(problem(a,0,title)?0:problem(a,1,title)?1:2):0),[backReview,setBackReview]=useState(false),[confirmed,confirm]=useState(false),[err,error]=useState(''),[custom,setCustom]=useState(''),[task,setTask]=useState<Record<string,string>>({}),[extra,setExtra]=useState(false),[skillEntry,setSkillEntry]=useState<string|null>(null);
 const patch=(v:Partial<Answers>)=>{change(JSON.stringify({...a,...v}));confirm(false);error('')};
 const setMission=(i:number,v:Partial<Mission>)=>patch({missions:a.missions.map((m,n)=>i===n?{...m,...v}:m)});
 const focus=(id:string)=>requestAnimationFrame(()=>{const el=document.getElementById('occ-'+id);el?.focus();el?.scrollIntoView({block:'nearest'})});
 function fail(id:string){error(id);focus(id)}
 const group=(id:string,label:string,body:ReactNode,hint?:string)=><section id={'occ-'+id} tabIndex={-1} aria-label={label} className="occ-group"><h3>{label} {hint&&<small aria-live={id==='missions'?'polite':undefined}>{hint}</small>}</h3>{body}{err===id&&<p role="alert">{t(id.startsWith('district-')?'badDistrict':'invalid')}</p>}</section>;
 const buttons=(items:string[],selected:string[],onClick:(v:string)=>void,translate=true)=> <div className="occ-options">{items.map(v=><button type="button" aria-pressed={selected.includes(v)} key={v} onClick={()=>onClick(v)}>{selected.includes(v)&&'✓ '}{translate?t(v):v}</button>)}</div>;
 const edit=(n:number,id:string)=>{setStep(n);setBackReview(true);focus(id)};
 function next(){const invalid=problem(a,step,title);if(invalid){fail(invalid);return}setStep(backReview&&!problem(a,1,title)?2:step+1);setBackReview(false);focus('heading')}
 function addCustom(){const v=custom.trim();if(!validText(v)||a.missions.length>=3||a.missions.some(m=>normalized(title(m))===normalized(v))){fail('missions');return}patch({missions:[...a.missions,newMission('custom',v)]});setCustom('');setExtra(false)}
 const choices=(items:string[])=>items.map(value=>({label:value,value}));
 return <div className="occ-wizard"><h2 id="occ-heading" tabIndex={-1}>{t('profileTitle')}</h2><ol className="candidate-steps">{['s1','s2','s3'].map((k,i)=><li key={k} aria-current={step===i?'step':undefined}><span>{i<step?'✓':i+1}</span>{t(k)}</li>)}</ol>
 <p className="occ-mobile-step">{t('step').replace('{n}',String(step+1))} · {t('s'+(step+1))}</p>
 <form className="candidate-form" onSubmit={e=>{e.preventDefault();if(step<2)next();else if(confirmed&&!problem(a,0,title)&&!problem(a,1,title))onFinish()}}><fieldset disabled={busy||pending} className="occ-body">
 {step===0&&<>
 {group('missions',t('missions'),<>{buttons(candidateMissions,a.missions.map(m=>m.category),c=>{const present=a.missions.some(m=>m.category===c);if(!present&&(a.missions.length===3||a.missions.some(m=>normalized(title(m))===normalized(t(c))))){fail('missions');return}patch({missions:present?a.missions.filter(m=>m.category!==c):[...a.missions,newMission(c)]})})}
 {a.missions.filter(m=>m.category==='custom').map(m=><button type="button" aria-pressed="true" key={m.name} onClick={()=>patch({missions:a.missions.filter(x=>x!==m)})}>✓ {m.name} ×</button>)}
 {extra?<label>{t('custom')}<input maxLength={100} value={custom} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addCustom();}}} onChange={e=>setCustom(e.target.value)}/><button type="button" onClick={addCustom}>{t('add')}</button></label>:<button type="button" disabled={a.missions.length>=3} onClick={()=>setExtra(true)}>+ {t('custom')}</button>}</>,t('selected').replace('{n}',String(a.missions.length)))}
 {group('city',t('area'),<><div className="occ-locations">
  <CandidateSelector label={t('city')} value={a.city} invalid={err==='city'} prompt={t('chooseCity')} searchLabel={t('searchCity')} allowCustom options={choices([...new Set([...workCities,...(a.city?[a.city]:[])])])} onChange={city=>patch({city,...(normalized(city)!=='kinshasa'?{communes:[],districts:{}}:{})})}/>
  {normalized(a.city)==='kinshasa'&&<div id="occ-communes" tabIndex={-1}>
   <CandidateSelector label={t('commune')} value={a.communes.at(-1)||''} invalid={err==='communes'} prompt={t('chooseCommune')} options={choices(communes)} searchLabel={t('searchCommune')} onChange={c=>{if(!a.communes.includes(c))patch({communes:[...a.communes,c]});}}/>
   {err==='communes'&&<p role="alert">{t('invalid')}</p>}
  </div>}
 </div>{a.communes.map(c=><div key={c}><button type="button" aria-label={c+' ×'} onClick={()=>{const d={...a.districts};delete d[c];patch({communes:a.communes.filter(x=>x!==c),districts:d});}}>{c} ×</button><details open={err==='district-'+c||undefined}><summary>{t('district')} · {c}</summary>{group('district-'+c,c,<input aria-label={t('district')+' · '+c} maxLength={100} value={a.districts[c]||''} onChange={e=>patch({districts:{...a.districts,[c]:e.target.value}})}/>)}</details></div>)}</>)}
 {group('schedule',t('when'),<><p>{t('days')}</p>{buttons(weekdays,a.days,v=>patch({days:toggle(a.days,v)}))}<p>{t('slots')}</p>{buttons(slots,a.slots,v=>patch({slots:v==='flexible'?(a.slots.includes(v)?[]:[v]):toggle(a.slots.filter(s=>s!=='flexible'),v)}))}</>)}
 {group('frequency',t('frequency'),buttons(['once','regular'],a.frequency,v=>patch({frequency:toggle(a.frequency,v)})),t('optional'))}</>}
 {step===1&&<>{a.missions.map((m,i)=>{const key=m.category+':'+m.name;const opts=(suggestions[m.category]||[]).map(t);return <section className="occ-mission" key={key}><h3>{title(m)}</h3>{group('tasks-'+i,t('tasks'),<>{buttons([...new Set([...opts,...m.tasks])],m.tasks,v=>setMission(i,{tasks:toggle(m.tasks,v)}),false)}{skillEntry===key?<div><input autoFocus aria-label={t('addTask')} maxLength={100} value={task[key]||''} onChange={e=>setTask({...task,[key]:e.target.value})}/><button type="button" onClick={()=>{const v=task[key]?.trim();if(!v||!validText(v)||m.tasks.some(s=>normalized(s)===normalized(v))||m.tasks.length>=16){fail('tasks-'+i);return}setMission(i,{tasks:[...m.tasks,v]});setTask({...task,[key]:''});setSkillEntry(null);}}>{t('add')}</button></div>:<button type="button" className="occ-text-action" onClick={()=>setSkillEntry(key)}>+ {t('addTask')}</button>}</>)}
 {group('experience-'+i,t('experience'),buttons(['beginner','friends','paid'],[m.experience],v=>setMission(i,{experience:v})))}
 {group('rate-'+i,t('rate'),<>{buttons(['omit','flexible','amount'],[m.rate==='agree'?'flexible':m.rate||'omit'],v=>setMission(i,{rate:v==='omit'?'':v==='flexible'?'agree':'amount',amount:'',currency:'',unit:''}))}{m.rate==='amount'&&<div className="occ-inline"><label>{t('amount')}<input inputMode="decimal" value={m.amount} onChange={e=>setMission(i,{amount:e.target.value})}/></label>{(['currency','unit'] as const).map(f=><label key={f}>{t(f)}<select value={m[f]} onChange={e=>setMission(i,{[f]:e.target.value})}><option value="">—</option>{(f==='currency'?['CDF','USD']:['hour','day','mission']).map(v=><option key={v} value={v}>{t(v)}</option>)}</select></label>)}</div>}</>,common.optional)}
 {group('example-'+i,t('example'),<textarea aria-label={t('example')} maxLength={500} value={m.example||''} onChange={e=>setMission(i,{example:e.target.value})}/>)}</section>})}
 {a.example&&group('example',t('example'),<textarea aria-label={t('example')} maxLength={500} value={a.example} onChange={e=>patch({example:e.target.value})}/>)}</>}
 {step===2&&<><OccasionalSummary answers={a} locale={locale} onEdit={n=>edit(n,n===0?'missions':'tasks-0')}/>
 <div className="candidate-notice"><label className="candidate-checkbox"><input type="checkbox" role="switch" checked={a.discovery} onChange={e=>patch({discovery:e.target.checked})}/>{t('allow')}</label><p>{t(a.discovery?'visible':'private')}</p></div>
 <label className="candidate-checkbox"><input type="checkbox" checked={confirmed} onChange={e=>confirm(e.target.checked)}/>{t('confirm')}</label></>}
 </fieldset><div className="candidate-actions">{step>0&&<button type="button" disabled={busy||pending} onClick={()=>{setStep(step-1);setBackReview(false)}}>{common.back}</button>}<button type="button" disabled={busy||pending} onClick={onSave}>{common.save}</button><button className="button-primary" disabled={busy||step===2&&!confirmed}>{step<2?(backReview?t('review'):step===1?t('verify'):common.next):editing?common.update:t('submit')}</button></div></form></div>;
}