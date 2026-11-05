'use client';
import {useEffect,useRef,useState} from 'react';
import {passkeyCeremony} from '../../lib/account-passkeys';
import {deletionReviewState} from '../../lib/deletion-review-copy';
const copy={
 en:{title:'Restricted deletion review',help:'Review the account obligations before acting. Execution rechecks eligibility and requires your passkey. It cannot override unresolved obligations.',note:'Review record',confirm:'I have independently reviewed this request and understand that execution permanently deletes an eligible account.',clarification:'Request clarification',postpone:'Postpone',execute:'Execute eligible deletion',refresh:'Refresh',error:'The decision was not saved. Refresh and verify eligibility and your authorization.'},
 fr:{title:'Vérification restreinte des suppressions',help:'Examinez les obligations du compte. L’exécution vérifie à nouveau l’éligibilité et exige votre clé d’accès. Elle ne contourne pas les obligations non résolues.',note:'Compte rendu de vérification',confirm:'J’ai examiné cette demande indépendamment et je comprends que l’exécution supprime définitivement un compte éligible.',clarification:'Demander des précisions',postpone:'Reporter',execute:'Exécuter la suppression éligible',refresh:'Actualiser',error:'La décision n’a pas été enregistrée. Actualisez et vérifiez l’éligibilité et votre autorisation.'},
 ln:{title:'Botali ya kolongola konti na ndingisa',help:'Tala mikumba ya konti liboso. Kolongola ekotala lisusu ndingisa mpe esengi fungola na yo. Ekoki koleka mikumba te.',note:'Compte rendu ya botali',confirm:'Natali lisengi oyo mpe nayebi ete kolongola konti oyo ebongi ekoki kozongisama te.',clarification:'Senga ndimbola',postpone:'Zelisa',execute:'Longola konti oyo ebongi',refresh:'Zongela',error:'Ekateli ebombami te. Zongela mpe tala ndingisa na yo.'},
 sw:{title:'Ukaguzi maalumu wa kufuta akaunti',help:'Kagua wajibu wa akaunti kwanza. Utekelezaji hukagua ustahiki tena na unahitaji ufunguo wako. Hauwezi kupuuza wajibu uliobaki.',note:'Rekodi ya ukaguzi',confirm:'Nimekagua ombi hili kwa njia huru na ninaelewa kwamba utekelezaji unafuta kabisa akaunti inayostahiki.',clarification:'Omba maelezo',postpone:'Ahirisha',execute:'Tekeleza ufutaji unaostahiki',refresh:'Sasisha',error:'Uamuzi haukuhifadhiwa. Sasisha na uthibitishe ustahiki na ruhusa yako.'},
};
type Row={reference:string;account_reference:string;message:string;state:string;updated_at:string};
export function AccountDeletionAdmin({locale,binding}:{locale:keyof typeof copy;binding:string}){
 const t=copy[locale],lock=useRef(false);
 const [rows,setRows]=useState<Row[]|null>(null),[refresh,setRefresh]=useState(0),[selected,setSelected]=useState(''),[note,setNote]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();void fetch('/api/shida/personal/deletion-review/',{cache:'no-store',headers:{'x-shida-session':binding},signal:controller.signal}).then(async r=>{if(r.ok){const data=await r.json();if(Array.isArray(data.requests))setRows(data.requests);}}).catch(()=>{});return()=>controller.abort();},[binding,refresh]);
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
 {rows.map(row=><article key={row.reference}><h3>{row.reference}</h3><p>{row.account_reference} · {deletionReviewState(locale,row.state)}</p><p style={{whiteSpace:'pre-wrap'}}>{row.message}</p>
 <label>{t.note}<textarea minLength={40} maxLength={3000} value={selected===row.reference?note:''} onChange={e=>{if(selected!==row.reference)setConfirmed(false);setSelected(row.reference);setNote(e.target.value);}}/></label>
 <label><input type="checkbox" checked={selected===row.reference&&confirmed} onChange={e=>{if(selected!==row.reference)setNote('');setSelected(row.reference);setConfirmed(e.target.checked);}}/>{t.confirm}</label>
 {(['clarification','postpone','execute'] as const).map(decision=><button key={decision} disabled={busy||!confirmed||selected!==row.reference||note.trim().length<40} onClick={()=>void decide(row,decision)}>{t[decision]}</button>)}
 </article>)}</section>;
}
