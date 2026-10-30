'use client';
import {accountDesignText} from '../../lib/account-design-copy';
import {accountNavigationCopy} from '../../lib/account-navigation-copy';
import {AccountSetting} from './account-setting';
import {spaceSettingsCopy} from '../../lib/space-settings-copy';
import {useEffect,useRef,useState} from 'react';
import {optionalRecoveryCopy} from '../../lib/optional-recovery-copy';
import {readAccount,AccountLoadError} from '../../lib/account-load';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
type Kind='phone'|'passphrase'|'code';
type Method={kind:Kind;phone:string|null;ready_at:string|null;verified:boolean;consumed:boolean};
export function OptionalRecoveryMethods({locale,binding,authorize,onBusy}:{locale:keyof typeof optionalRecoveryCopy;binding:string;authorize:(action:string)=>Promise<string>;onBusy:(value:boolean)=>void}){
 const [checkedAt,setCheckedAt]=useState(()=>Date.now());
 const copy=mySpaceCopy[locale],cancel=accountNavigationCopy[locale].cancel;
 const d=(key:Parameters<typeof accountDesignText>[1])=>accountDesignText(locale,key);
 const [loadState,setLoadState]=useState<'loading'|'loaded'|'error'|'auth'>('loading'),[attempt,setAttempt]=useState(0);
 const t=optionalRecoveryCopy[locale],lock=useRef(false),live=useRef(true);
 const [methods,setMethods]=useState<Method[]>([]),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[phrase,setPhrase]=useState(''),[phone,setPhone]=useState(''),[reference,setReference]=useState(''),[otp,setOtp]=useState(''),[secret,setSecret]=useState('');
 useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
 async function api(path='',body?:object){const response=await fetch(`/api/shida/personal/security/recovery/${path}`,{method:body?'POST':'GET',cache:'no-store',headers:{'x-shida-session':binding,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw new Error();return response.json();}
 useEffect(()=>{const abort=new AbortController();void readAccount('recovery/',binding,abort.signal).then(d=>{if(abort.signal.aborted)return;if(!Array.isArray(d.methods))throw Error();setCheckedAt(Date.now());setMethods(d.methods);setLoadState('loaded');}).catch(error=>{if(!abort.signal.aborted)setLoadState(error instanceof AccountLoadError&&error.status===401?'auth':'error');});return()=>abort.abort();},[binding,attempt]);
 async function run(work:()=>Promise<void>){if(lock.current)return;lock.current=true;setBusy(true);onBusy(true);setNotice('');try{await work();if(live.current){setAttempt(value=>value+1);}}catch{if(live.current)setNotice(t.error);}finally{lock.current=false;if(live.current){setBusy(false);onBusy(false);}}}
 async function protectedCall(path:string,body:object){const authorization=await authorize('recovery');if(!live.current)throw Error();return api(path,{...body,authorization});}
 const status=(kind:Kind)=>{const method=methods.find(m=>m.kind===kind);return !method?spaceSettingsCopy[locale].unset:method.consumed?t.used:!method.verified?t.unverified:!method.ready_at||Date.parse(method.ready_at)>checkedAt?t.waiting:t.verified;};
 const existing=(kind:Kind)=>methods.filter(m=>m.kind===kind).map(method=><div key={method.kind}><p>{method.phone}{method.ready_at&&<> · {t.ready}: {new Date(method.ready_at).toLocaleString(locale)}</>}</p><button type="button" onClick={()=>void run(async()=>{await protectedCall('remove/',{kind:method.kind});setSecret('');})}>{t.remove} — {t[method.kind]}</button></div>);
 return <section id="optional-recovery">{notice&&<p role="status">{notice}</p>}{loadState==='loading'&&<p role="status">{({en:'Loading…',fr:'Chargement…',ln:'Kozela…',sw:'Inapakia…'})[locale]}</p>}{(loadState==='error'||loadState==='auth')&&<div role="alert"><p>{loadState==='auth'?copy.auth:copy.loadError}</p><button onClick={()=>{setLoadState('loading');setAttempt(v=>v+1);}}>{copy.retry}</button></div>}<fieldset disabled={busy||loadState!=='loaded'}>
 <AccountSetting icon="phone" cancel={cancel} onCancel={()=>{setPhone('');setReference('');setOtp('');}} title={t.phone} status={loadState==='loaded'?status('phone'):undefined}><p>{d('phoneHelp')}</p>{existing('phone')}<p className="space-security-requirement">{d('methodProof')}</p>
 <form onSubmit={e=>{e.preventDefault();void run(async()=>{if(reference){await api('phone/verify/',{reference,code:otp});setReference('');setOtp('');setPhone('');setNotice(t.saved);}else{const result=await protectedCall('phone/start/',{phone,language:locale});setReference(result.reference);}});}}><label>{reference?t.proof:t.phone}<input type={reference?'text':'tel'} inputMode={reference?'numeric':'tel'} autoComplete={reference?'one-time-code':'off'} value={reference?otp:phone} onChange={e=>reference?setOtp(e.target.value):setPhone(e.target.value)} maxLength={reference?6:32} pattern={reference?'[0-9]{6}':undefined} required/></label>{reference&&<p>{t.unverified}</p>}<button>{reference?t.verify:t.send}</button>{reference&&<button type="button" onClick={()=>{setReference('');setOtp('');}}>{t.replace}</button>}</form>
 </AccountSetting><AccountSetting icon="lock" cancel={cancel} onCancel={()=>setPhrase('')} title={t.passphrase} status={loadState==='loaded'?status('passphrase'):undefined}><p>{d('passphraseHelp')}</p>{existing('passphrase')}<p className="space-security-requirement">{d('methodProof')}</p>
 <form onSubmit={e=>{e.preventDefault();const value=phrase;setPhrase('');void run(async()=>{await protectedCall('set/',{kind:'passphrase',value});setNotice(t.saved);});}}><label>{t.passphrase}<input type="password" autoComplete="new-password" value={phrase} onChange={e=>setPhrase(e.target.value)} minLength={20} maxLength={256} required/></label><p>{t.strength}</p><button>{t.save}</button></form>
 </AccountSetting><AccountSetting icon="shield" cancel={cancel} onCancel={()=>setSecret('')} title={t.code} status={loadState==='loaded'?status('code'):undefined}><p>{d('codeHelp')}</p>{existing('code')}<p className="space-security-requirement">{d('methodProof')}</p><p>{t.store}</p>{secret?<><output className="recovery-secret">{secret}</output><button type="button" onClick={()=>setSecret('')}>{t.hide}</button></>:<button type="button" onClick={()=>void run(async()=>{const value=await protectedCall('set/',{kind:'code'});if(live.current){setSecret(value.code);setNotice(t.saved);}})}>{t.generate}</button>}
 </AccountSetting></fieldset></section>;
}
