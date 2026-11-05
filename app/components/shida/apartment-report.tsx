'use client';
import {useEffect, useRef, useState} from 'react';
import {WenzeBuyerProvider, useWenzeBuyer} from './wenze-buyer';
import {apartmentSafetyCopy} from '../../lib/apartment-safety-copy';
import './wenze-safety.css';
type Locale = keyof typeof apartmentSafetyCopy;
type Props = {locale: Locale; reference: string};

// Reuse the established Personal session and login provider; no apartment account.
export function ApartmentReport(props: Props) {
 const t = apartmentSafetyCopy[props.locale];
 return <WenzeBuyerProvider locale={props.locale} loginMessage={t.login}><BoundReport {...props}/></WenzeBuyerProvider>;
}
function BoundReport(props: Props) {
 const actor = useWenzeBuyer();
 return <Report key={`${actor.binding}:${props.reference}`} {...props} actor={actor}/>;
}
function Report({locale, reference, actor}: Props & {actor: ReturnType<typeof useWenzeBuyer>}) {
 const t = apartmentSafetyCopy[locale], dialog = useRef<HTMLDialogElement>(null), lock = useRef(false), alive = useRef(true);
 const [reason, setReason] = useState('false_property'), [message, setMessage] = useState('');
 const [busy, setBusy] = useState(false), [saved, setSaved] = useState(''), [error, setError] = useState('');
 useEffect(() => {alive.current = true; return () => {alive.current = false;};}, []);
 async function submit() {
  if (lock.current || !actor.binding) return;
  lock.current = true; setBusy(true); setError('');
  try {
   const response = await fetch('/api/shida/personal/support/apartment-report/', {method:'POST', cache:'no-store', signal:AbortSignal.timeout(15000), headers:{'Content-Type':'application/json', 'x-shida-session':actor.binding}, body:JSON.stringify({listing_ref:reference, reason, message:message.trim(), language:locale})});
   if (!response.ok) throw Object.assign(new Error(), {status:response.status});
   const value = await response.json();
   if (!/^SCT_[A-Za-z0-9_-]+$/.test(value.reference)) throw Error();
   if (alive.current) {setSaved(value.reference); setMessage('');}
  } catch (error) {
   if (alive.current) setError(error instanceof Error && 'status' in error && error.status === 429 ? t.limit : t.error);
  } finally {lock.current = false; if (alive.current) setBusy(false);}
 }
 return <><button className="wzp-report-action" type="button" disabled={actor.checking} onClick={() => actor.binding ? dialog.current?.showModal() : actor.login()}>{t.report}</button>
  <dialog ref={dialog} className="wzp-report-dialog" aria-label={t.report}><header><h2>{t.report}</h2><button type="button" onClick={() => dialog.current?.close()} aria-label={t.close}>×</button></header>
   {saved ? <p role="status">{t.saved} <strong>{saved}</strong></p> : <form onSubmit={event => {event.preventDefault(); void submit();}}><p>{t.privacy}</p><fieldset disabled={busy}>
    <label>{t.category}<select value={reason} onChange={event => setReason(event.target.value)}>{Object.entries(t.reasons).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <label>{t.description}<textarea required maxLength={3000} rows={5} value={message} onChange={event => setMessage(event.target.value)}/></label>
    <button className="button button-primary" disabled={!message.trim()}>{t.send}</button></fieldset>{error && <p role="alert">{error}</p>}</form>}
   <button type="button" onClick={() => dialog.current?.close()}>{t.close}</button>
  </dialog></>;
}
