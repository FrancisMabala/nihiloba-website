'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {missionTerms,missionProblem,payload,type MissionValues,type Terms} from '../../lib/mission-form';
import {listingText} from '../../lib/personal-missions-copy';
import {missionText} from '../../lib/mission-copy';
import {occText,type OccLocale} from '../../lib/occasional-copy';
import {categories,weekdays,toggle} from '../../lib/occasional-form';
import {personalOfferCopy} from '../../lib/personal-offer-copy';
import {MissionPresentation} from './mission-presentation';
import {MissionPicker} from './mission-picker';
import './occasional-wizard.css';
type Props={editLabel?:string;locations?:{kinshasa_communes:string[];quartiers:Record<string,string[]>};locale:OccLocale;values:MissionValues;change:(v:MissionValues)=>void;busy:boolean;pending:boolean;preview:(v:MissionValues)=>Promise<MissionValues>;save:()=>void;publish:()=>void};
export function MissionWizard({editLabel,locations,locale,values,change,busy,pending,preview,save,publish}:Props){
 const t=(k:string)=>missionText(locale,k),o=(k:string)=>occText(locale,k),c=personalOfferCopy[locale],m=missionTerms(values);
 const [step,go]=useState(0),[result,setResult]=useState<MissionValues|null>(null),[confirmed,confirm]=useState(false),[error,setError]=useState(''),[checking,check]=useState(false),[manual,setManual]=useState(!!values.quartier),[ref,reference]=useState<{kinshasa_communes:string[];quartiers:Record<string,string[]>}>(locations??{kinshasa_communes:[],quartiers:{}});
 useEffect(()=>{if(locations)return;const ctl=new AbortController();void fetch('/api/shida/registration-reference/?resource=locations',{signal:ctl.signal}).then(r=>r.ok?r.json():null).then(r=>{if(r)reference(r)}).catch(()=>{});return()=>ctl.abort()},[locations]);
 const update=(v:MissionValues,p:Partial<Terms>={})=>{confirm(false);setError('');change({...values,...v,mission_terms:JSON.stringify({...m,...p})})};
 const fail=(key:string)=>{setError(key);requestAnimationFrame(()=>document.querySelector<HTMLElement>('#mission-'+key)?.focus())};
 async function next(){const invalid=missionProblem(values,m,step,ref.kinshasa_communes);if(invalid){fail(invalid);return}
 if(step===0&&!result){go(1);return}if(step===0&&missionProblem(values,m,1,ref.kinshasa_communes)){go(1);return}check(true);
 try{setResult(await preview(payload(values)));go(2)}catch(err){const key=err instanceof Error?err.message:'';const simple=['category','custom','job','short_summary','work_city','commune','quartier'].includes(key);if(simple)go(0);else go(1);fail(key)}finally{check(false)}}
 const field=(key:string,label:string,node:ReactNode)=><div className="mission-field" id={'mission-'+key} tabIndex={-1}><strong>{label}</strong>{node}{error===key&&<small role="alert">{key==='short_summary'?t('descriptionHelp'):o('invalid')}</small>}</div>;
 const input=(k:string,label:string,v:string,cb:(s:string)=>void,type='text')=>field(k,label,<input aria-label={label} maxLength={160} type={type} value={v} onChange={e=>cb(e.target.value)}/>);
 const choices=(k:string,label:string,keys:string[],selected:string[],cb:(v:string)=>void,translate=t)=>field(k,label,<div>{k==='category'&&<p>{listingText(locale,'workExample')}</p>}<div className="occ-options">{keys.map(v=><button type="button" key={v} aria-pressed={selected.includes(v)} onClick={()=>cb(v)}>{selected.includes(v)?'✓ ':''}{translate(v)}</button>)}</div></div>);
 const loc=(k:string,v:string)=>{if(k!=='quartier')setManual(false);update({...k==='work_city'?{commune:'',quartier:''}:k==='commune'?{quartier:''}:{},[k]:v})};
 const location=(k:string,label:string,opts:string[],strict=false)=>field(k,label,<MissionPicker id={'select-'+k} value={values[k]||''} label={label} options={opts} strict={strict} onChange={v=>loc(k,v)}/>);
 const flag=(k:'date_flexible'|'overnight')=><label className="candidate-checkbox"><input type="checkbox" checked={m[k]} onChange={e=>update({},k==='date_flexible'?{date_flexible:e.target.checked,day:''}:{overnight:e.target.checked})}/>{t(k)}</label>;
 const kin=values.work_city?.trim().toLowerCase()==='kinshasa', legacy=[values.duration_frequency,values.work_schedule,values.budget].filter(Boolean).join(' · ');
 return <div className="occ-wizard"><ol className="candidate-steps">{['s1','s2','s3'].map((k,i)=><li key={k} aria-current={step===i?'step':undefined}><span>{i<step?'✓':i+1}</span>{t(k)}</li>)}</ol><form className="candidate-form" onSubmit={e=>{e.preventDefault();if(step<2)void next();else if(confirmed)publish()}}><h2>{t(step===0?'s1':step===1?'conditions':'s3')}</h2><fieldset className="occ-body" disabled={busy||pending||checking}>
 {legacy&&<p>{t('legacy')}: {legacy}</p>}
 {step===0&&<>{choices('category',t('category')+' *',[...categories,'custom'],[m.category],v=>update({job:v==='custom'?'':t(v)},{category:v,custom:''}))}
 {m.category==='custom'&&input('custom',t('customName')+' *',m.custom,v=>update({job:!values.job||values.job===m.custom?v:values.job},{custom:v}))}
 {input('job',t('job')+' *',values.job||'',v=>update({job:v}))}
 {field('short_summary',t('short_summary')+' *',<textarea aria-label={t('short_summary')} maxLength={1500} value={values.short_summary||''} placeholder={t('descriptionHelp')} onChange={e=>update({short_summary:e.target.value})}/>)}
 <p>{t('privacy')}</p><div className="occ-inline">{location('work_city',o('city')+' *',['Kinshasa','Lubumbashi','Goma','Kisangani','Bukavu','Matadi','Mbuji-Mayi','Kananga'])}{kin?location('commune',o('communes')+' *',ref.kinshasa_communes,true):input('commune',o('communes'),values.commune||'',v=>loc('commune',v))}
 {(!kin||values.commune)&&<div>{manual?input('quartier',t('quartier'),values.quartier||'',v=>loc('quartier',v)):location('quartier',t('quartier'),ref.quartiers?.[values.commune||'']||[],true)}<button type="button" aria-pressed={manual} onClick={()=>{setManual(!manual);loc('quartier','')}}>{t('manual')}</button></div>}</div></>}
 {step===1&&<>{choices('frequency',t('frequency')+' *',['once','regular'],[m.frequency],v=>update({},v==='once'?{frequency:v,weekdays:[],schedule_note:'',start_date:''}:{frequency:v,day:'',date_flexible:false}))}
 {m.frequency==='once'&&<>{flag('date_flexible')}{!m.date_flexible&&input('day',t('day'),m.day,v=>update({},{day:v}),'date')}</>}
 {m.frequency==='regular'&&<>{choices('weekdays',o('days'),weekdays,m.weekdays,v=>update({},{weekdays:toggle(m.weekdays,v)}),o)}{input('schedule_note',t('schedule_note'),m.schedule_note,v=>update({},{schedule_note:v}))}{input('start_date',t('start_date'),m.start_date,v=>update({},{start_date:v}),'date')}</>}
 {choices('hours',t('hours')+' *',['fixed','flexible'],[m.hours],v=>update({},{hours:v,start:'',end:'',overnight:false}))}
 {m.hours==='fixed'&&<><div className="occ-inline">{input('start',t('start'),m.start,v=>update({},{start:v}),'time')}{input('end',t('end'),m.end,v=>update({},{end:v}),'time')}</div>{flag('overnight')}</>}
 {choices('rate',t('pay'),['omit','agree','amount'],[m.rate||'omit'],v=>update({},{rate:v==='omit'?'':v,amount:'',unit:'',currency:''}),v=>v==='agree'?o('flexible'):o(v))}
 {m.rate==='amount'&&<div className="occ-inline">{input('amount',o('amount'),m.amount,v=>update({},{amount:v}))}{(['currency','unit'] as const).map(k=><label key={k}>{o(k)}<select aria-label={o(k)} value={m[k]} onChange={e=>update({},{[k]:e.target.value})}><option value="">—</option>{(k==='currency'?['USD','CDF']:['hour','day','mission']).map(v=><option value={v} key={v}>{o(v)}</option>)}</select></label>)}</div>}
 {input('experience',t('experience'),m.experience,v=>update({},{experience:v}))}<button type="button" onClick={()=>update({},{experience:t('beginner')})}>{t('beginner')}</button></>}
 {step===2&&result&&<><MissionPresentation locale={locale} title={result.job||''} location={[result.work_city,result.commune,result.quartier].filter(Boolean).join(', ')} description={result.short_summary} frequency={result.duration_frequency} hours={result.work_schedule} pay={result.budget} experience={result.optional_experience}/><button type="button" onClick={()=>go(0)}>{t('change1')}</button><button type="button" onClick={()=>go(1)}>{t('change2')}</button><label className="candidate-checkbox"><input type="checkbox" checked={confirmed} onChange={e=>confirm(e.target.checked)}/>{t('confirm')}</label></>}
 </fieldset>{error&&!document.getElementById('mission-'+error)&&<p role="alert">{c.error}</p>}
 <div className="candidate-actions">{step>0&&<button type="button" disabled={busy||pending||checking} onClick={()=>go(step-1)}>{c.back}</button>}<button type="button" disabled={busy||pending||checking} onClick={save}>{editLabel?c.back:c.save}</button><button className="button-primary" disabled={busy||checking||step===2&&!confirmed}>{step===2?(editLabel||t('publish')):c.next}</button></div></form></div>
}