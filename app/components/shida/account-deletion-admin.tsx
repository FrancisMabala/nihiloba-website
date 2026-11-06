'use client';
import {useEffect,useRef,useState} from 'react';
import {passkeyCeremony} from '../../lib/account-passkeys';
import {deletionText} from '../../lib/account-deletion-copy';
import {localDeletionDate,type DeletionReceipt} from './account-deletion';
import {deletionReviewState} from '../../lib/deletion-review-copy';
const copy={
 en:{title:'Restricted deletion review',help:'Review the disputed obligations. Resolving a review never deletes an account; the user must confirm a new deletion schedule.',note:'Review record',confirm:'I have independently reviewed this request. The user must confirm deletion separately.',clarification:'Request clarification',postpone:'Postpone',resolved:'Mark review resolved',refresh:'Refresh',error:'The decision was not saved. Refresh and verify eligibility and your authorization.'},
 fr:{title:'Vérification restreinte des suppressions',help:'Examinez les obligations contestées. Résoudre une vérification ne supprime aucun compte ; l’utilisateur doit confirmer une nouvelle programmation.',note:'Compte rendu de vérification',confirm:'J’ai examiné cette demande indépendamment. L’utilisateur doit confirmer séparément la suppression.',clarification:'Demander des précisions',postpone:'Reporter',resolved:'Marquer la vérification résolue',refresh:'Actualiser',error:'La décision n’a pas été enregistrée. Actualisez et vérifiez l’éligibilité et votre autorisation.'},
 ln:{title:'Botali ya kolongola konti na ndingisa',help:'Tala mikumba oyo bato baboyi. Kosilisa botali elongolaka konti te ; moto asengeli kondimisa yo moko.',note:'Compte rendu ya botali',confirm:'Natali lisengi oyo. Moto asengeli kondimisa kolongola konti na ye.',clarification:'Senga ndimbola',postpone:'Zelisa',resolved:'Botali esili',refresh:'Zongela',error:'Ekateli ebombami te. Zongela mpe tala ndingisa na yo.'},
 sw:{title:'Ukaguzi maalumu wa kufuta akaunti',help:'Kagua wajibu unaopingwa. Kutatua ukaguzi hakufuti akaunti; mtumiaji lazima athibitishe ratiba mpya ya ufutaji.',note:'Rekodi ya ukaguzi',confirm:'Nimekagua ombi hili kwa njia huru. Mtumiaji lazima athibitishe ufutaji kando.',clarification:'Omba maelezo',postpone:'Ahirisha',resolved:'Weka ukaguzi umetatuliwa',refresh:'Sasisha',error:'Uamuzi haukuhifadhiwa. Sasisha na uthibitishe ustahiki na ruhusa yako.'},
};
type Row={reference:string;account_reference:string;message:string;state:string;updated_at:string};
export function AccountDeletionAdmin({locale,binding}:{locale:keyof typeof copy;binding:string}){
 const t=copy[locale],lock=useRef(false);
 const [jobs,setJobs]=useState<(DeletionReceipt & {attempts:number;failure_code:string|null})[]>([]);
 const [rows,setRows]=useState<Row[]|null>(null),[refresh,setRefresh]=useState(0),[selected,setSelected]=useState(''),[note,setNote]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();void fetch('/api/shida/personal/deletion-review/',{cache:'no-store',headers:{'x-shida-session':binding},signal:controller.signal}).then(async r=>{if(r.ok){const data=await r.json();if(Array.isArray(data.requests))setRows(data.requests);if(Array.isArray(data.deletions))setJobs(data.deletions);}}).catch(()=>{});return()=>controller.abort();},[binding,refresh]);
 async function post(path:string,body:object){const r=await fetch('/api/shida/personal/'+path,{method:'POST',cache:'no-store',headers:{'x-shida-session':binding,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error();return r.json();}
 async function decide(row:Row,decision:string){if(lock.current)return;lock.current=true;setBusy(true);setError(false);try{
  const options=await post('security/passkeys/verify/options/',{action:'review'});
  const credential=await passkeyCeremony(options.options,false);
  const proof=await post('security/passkeys/verify/finish/',{reference:options.reference,credential});
  await post(`deletion-review/${row.reference}/`,{decision,note,revision:row.updated_at,authorization:proof.authorization});
  setNote('');setConfirmed(false);setSelected('');setRefresh(v=>v+1);
 }catch{setError(true);}finally{lock.current=false;setBusy(false);}}
 if(!rows)return null;
 return <section className="space-security"><h2>{t.title}</h2><p>{t.help}</p>{error&&<p role="alert">{t.error}</p>}<button disabled={busy} onClick={()=>setRefresh(v=>v+1)}>{t.refresh}</button>
 {jobs.map(job=><article key={job.reference}><h3>{job.reference}</h3><p>{deletionText(locale,'date')}: {localDeletionDate(job.scheduled_at,locale)}</p><p>{deletionText(locale,job.status==='completed'?'completed':job.can_cancel?'pending':'closed')}</p>{job.failure_code&&<p role="status">{deletionText(locale,job.status==='preserved'?'retention':'statusError')}</p>}</article>)}
 {rows.map(row=><article key={row.reference}><h3>{row.reference}</h3><p>{row.account_reference} · {deletionReviewState(locale,row.state)}</p><p style={{whiteSpace:'pre-wrap'}}>{row.message}</p>
 <label>{t.note}<textarea minLength={40} maxLength={3000} value={selected===row.reference?note:''} onChange={e=>{if(selected!==row.reference)setConfirmed(false);setSelected(row.reference);setNote(e.target.value);}}/></label>
 <label><input type="checkbox" checked={selected===row.reference&&confirmed} onChange={e=>{if(selected!==row.reference)setNote('');setSelected(row.reference);setConfirmed(e.target.checked);}}/>{t.confirm}</label>
 {(['clarification','postpone','resolved'] as const).map(decision=><button key={decision} disabled={busy||!confirmed||selected!==row.reference||note.trim().length<40} onClick={()=>void decide(row,decision)}>{t[decision]}</button>)}
 </article>)}</section>;
}
