'use client';
import Image from 'next/image';
import {useRef,useState} from 'react';
import {candidateWorkspaceCopy} from '../../lib/candidate-workspace-copy';
import {candidateCopy} from '../../lib/candidate-profile-copy';
import {candidateUX,candidateSearchFields,candidateOptionalFields} from '../../lib/candidate-ux';
import {formText} from '../../lib/professional-form-copy';
import {CandidateChips} from './candidate-chips';
import {CandidateSelector} from './candidate-selector';

type Props={
 locale:keyof typeof candidateCopy; values:Record<string,string>; step:number; categories:{id:string;label:string}[];
 editing:boolean; existingCV:boolean; busy:boolean; frozen:boolean; confirmed:boolean;
 setConfirmed:(value:boolean)=>void; setStep:(step:number)=>void; change:(key:string,value:string)=>void;
 save:()=>void; finish:()=>void; upload:(file:File)=>Promise<void>;
};
const experienceFields=['experience_level','skills','description'];
const split=(value='')=>value.split(',').map(part=>part.trim()).filter(Boolean);
export function ProfessionalProfileForm({locale,values,step,categories,editing,existingCV,busy,frozen,confirmed,setConfirmed,setStep,change,save,finish,upload}:Props){
 const t=candidateCopy[locale],u=candidateUX[locale],c=(key:Parameters<typeof formText>[1])=>formText(locale,key);
 const form=useRef<HTMLFormElement>(null),fileInput=useRef<HTMLInputElement>(null);
 const [errors,setErrors]=useState<string[]>([]),[returning,setReturning]=useState(false),[optional,setOptional]=useState(false),[fileError,setFileError]=useState('');
 const [uploading,setUploading]=useState(false),uploadLock=useRef(false);
 const title=(field:string)=>t.fields[field as keyof typeof t.fields]||field;
 const missing=(keys:string[])=>keys.filter(key=>!values[key]?.trim());
 const invalid=missing([...candidateSearchFields,...experienceFields]);
 const choices=split(values.work_types);
 const schedules=Object.values(candidateUX).flatMap(copy=>copy.contracts.slice(0,2));
 const contracts=[...new Set([...u.contracts,...choices])];
 const attached=Boolean(values.cv_asset_ref||existingCV&&values.cv_choice!=='2');
 const filename=values.cv_filename||t.uploaded;
 const unavailable=busy||uploading||frozen;
 function go(next:number){setErrors([]);setStep(next);requestAnimationFrame(()=>form.current?.querySelector<HTMLElement>('h2')?.focus());}
 function edit(next:number,target?:'details'|'cv'){
  setReturning(true);setOptional(target==='details');go(next);
  if(target)requestAnimationFrame(()=>target==='cv'?fileInput.current?.focus():form.current?.querySelector<HTMLElement>('details summary')?.focus());
 }
 function advance(){
  if(step===2){if(!invalid.length&&(editing||confirmed))finish();return;}
  const incomplete=missing(step===0?candidateSearchFields:experienceFields);
  if(incomplete.length){setErrors(incomplete);form.current?.querySelector<HTMLElement>('[data-field="'+incomplete[0]+'"] button,[data-field="'+incomplete[0]+'"] input,[data-field="'+incomplete[0]+'"] textarea')?.focus();return;}
  go(returning?2:step+1);setReturning(false);
 }
 function field(key:string){
  const value=values[key]||'',required=[...candidateSearchFields,...experienceFields].includes(key),name=title(key);
  const error=errors.includes(key)&&!value.trim();
  let control;
  if(['primary_category','experience_level','availability'].includes(key)){
   const items=key==='primary_category'?categories.map(item=>({value:item.id,label:item.label})):(key==='availability'?u.availability:u.experience).map(item=>({value:item,label:item}));
   if(value&&!items.some(item=>item.value===value))items.push({value,label:value});
   control=<CandidateSelector label={name} value={value} options={items} prompt={c(key==='primary_category'?'sector':key==='availability'?'availability':'level')} onChange={v=>change(key,v)} invalid={error}/>;
  }else if(['desired_titles','skills','languages'].includes(key)){
   control=<CandidateChips label={name} value={value} onChange={v=>change(key,v)} required={required} max={key==='desired_titles'?3:20} add={u.add} remove={u.removeItem} hint={key==='desired_titles'?c('roles'):undefined} placeholder={key==='skills'?c('skill'):undefined}/>;
  }else if(key==='work_types'){
   control=<fieldset className="work-types"><legend>{name} *</legend><div>{[true,false].map(schedule=><div key={String(schedule)}><strong>{c(schedule?'schedule':'contract')}</strong>{contracts.filter(option=>schedules.includes(option)===schedule).map(option=><label key={option}><input type="checkbox" checked={choices.includes(option)} onChange={e=>change(key,(e.target.checked?[...choices,option]:choices.filter(item=>item!==option)).join(', '))}/>{option}</label>)}</div>)}</div></fieldset>;
  }else{
   control=<label><span>{name}{required?' *':''}</span>{key==='description'?<><small>{c('intro')}</small><textarea required maxLength={2000} value={value} onChange={e=>change(key,e.target.value)}/><small className="candidate-count">{value.length} / 2 000</small></>:<input type={key==='social_link'?'url':'text'} required={required} maxLength={2000} value={value} onChange={e=>change(key,e.target.value)}/>}</label>;
  }
  return <div key={key} data-field={key} className={['description','work_types'].includes(key)?'candidate-wide':''}>{control}{error&&<small role="alert">{c('required')} · {name}</small>}</div>;
 }
 function reviewRow(key:string,value:string,name=title(key)){return value&&<div key={key} className={key==='description'?'review-introduction':''}><dt>{name}</dt><dd>{value}</dd></div>;}
 const groups=[t.steps[0],t.steps[1],u.reviewGroups[2]];
 return <div className="candidate-wizard-layout professional-wizard">
  <aside className="candidate-wizard-art"><Image src="/images/marketplace-heroes/jobs.svg" width={360} height={190} alt=""/><h2>{t.title}</h2><p>{t.intro}</p>{step!==2&&<p className="wizard-privacy">{t.privacy}</p>}</aside>
  <div><ol className="candidate-steps">{t.steps.map((name,index)=><li key={name} aria-current={step===index?'step':undefined}><span>{index+1}</span>{name}</li>)}</ol>
  <form inert={busy||uploading} noValidate ref={form} className="candidate-form" onSubmit={e=>{e.preventDefault();if(!busy&&!uploading)advance();}}>
   <p className="mobile-step">{c('step')} {step+1} {c('of')} 3{step===0?' · '+groups[0]:''}</p>
   <h2 tabIndex={-1}>{step===0?c('question'):step===1?groups[1]:t.review}</h2>
   {step!==2&&<p className="mobile-step">{candidateWorkspaceCopy[locale].privacy}</p>}
   {step<2?<><div className="candidate-fields">{(step===0?candidateSearchFields:experienceFields).map(field)}</div>
    {step===1&&<><details className="candidate-optional" open={optional} onToggle={e=>setOptional(e.currentTarget.open)}><summary>{c('optional')}</summary><div className="candidate-fields">{candidateOptionalFields.map(field)}</div></details>
     <fieldset><legend>CV</legend><p>{c('pdf')}</p>{attached&&<p>{filename}</p>}
      <label className="candidate-upload">{attached?c('replace'):c('upload')}<input ref={fileInput} aria-label={attached?c('replace'):c('upload')} type="file" accept="application/pdf" disabled={unavailable} onChange={async e=>{
       const file=e.target.files?.[0];e.target.value='';if(!file||uploadLock.current)return;
       uploadLock.current=true;setUploading(true);setFileError('');
       try{await upload(file);}catch(error){setFileError(error instanceof Error?error.message:t.error);}finally{uploadLock.current=false;setUploading(false);}
      }}/></label>{attached&&<button type="button" disabled={unavailable} onClick={()=>{change('cv_asset_ref','');change('cv_filename','');change('cv_choice','2');setFileError('');}}>{u.removeItem}</button>}{fileError&&<p role="alert">{fileError}</p>}</fieldset></>}
   </>:<>{groups.map((name,index)=><section className="candidate-review-group" key={name}><header><h3>{name}</h3><button type="button" disabled={unavailable} onClick={()=>edit(index===0?0:1,index===2?'details':undefined)}>{c((['editSearch','editExperience','editDetails'] as const)[index])}</button></header>
   <dl className="candidate-review">{index===0?<>{reviewRow('primary_category',categories.find(cat=>cat.id===values.primary_category)?.label||values.primary_category)}{['desired_titles','city'].map(key=>reviewRow(key,values[key]))}{[true,false].map(schedule=>reviewRow(String(schedule),choices.filter(option=>schedules.includes(option)===schedule).join(', '),c(schedule?'schedule':'contract')))}{reviewRow('availability',values.availability)}</>:index===1?experienceFields.map(key=>reviewRow(key,values[key])):<>{candidateOptionalFields.map(key=>reviewRow(key,values[key]))}<div><dt>CV</dt><dd>{attached?filename:<>{c('noFile')} <button type="button" disabled={unavailable} onClick={()=>edit(1,'cv')}>{c('upload')}</button></>}</dd></div></>}</dl></section>)}
   <p className="candidate-notice">{t.privacy}</p>{!editing&&<label className="candidate-checkbox"><input type="checkbox" checked={confirmed} disabled={unavailable} onChange={e=>setConfirmed(e.target.checked)}/>{t.confirm}</label>}</>}
   <div className="candidate-actions">{step>0&&<button type="button" disabled={unavailable} onClick={()=>{setReturning(false);go(step-1);}}>{t.back}</button>}<button type="button" disabled={unavailable} onClick={save}>{t.save}</button><button className="button-primary" disabled={busy||uploading||step===2&&(invalid.length>0||!editing&&!confirmed)}>{step===2?(editing?t.update:t.create):returning?c('backReview'):step===1?c('check'):t.next}</button></div>
  </form></div></div>;
}
