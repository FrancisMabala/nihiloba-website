'use client';
import { useEffect, useRef, useState } from 'react';
import { request, DashboardApiError } from '../../lib/restaurant-seller-browser';
import { preparationCopy, type PreparationLocale } from '../../lib/restaurant-preparation-copy';
import { preparationEnvelope, type Station } from '../../lib/restaurant-preparation-contract';
import './restaurant-preparation.css';
type Routes = { items: { item_ref: string; name: string; station: Station | null }[]; has_more: boolean; revision: string };
export function PreparationRouting(props: { path: string; binding: string; locale: PreparationLocale }) {
  return <RoutingScope key={`${props.path}:${props.binding}`} {...props}/>;
}
function RoutingScope({ path, binding, locale }: { path: string; binding: string; locale: PreparationLocale }) {
  const t = preparationCopy[locale], [page, setPage] = useState(1), [rows, setRows] = useState<Routes | null>(null), [selected, setSelected] = useState(''), [station, setStation] = useState<Station>('kitchen'), [declared, setDeclared] = useState(false);
  const [pending, setPending] = useState<ReturnType<typeof preparationEnvelope> | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [fresh, setFresh] = useState(false), [accessLost, setAccessLost] = useState(false);
  const lock = useRef(false), generation = useRef(0), lost = useRef(false), refresh = useRef<() => Promise<boolean>>(async () => false);
  useEffect(() => {
    let alive = true; const controller = new AbortController(), guard = generation;
    const clear = () => { generation.current++; lost.current = true; setAccessLost(true); setRows(null); setSelected(''); setPending(null); setDeclared(false); setMessage(t.lost); setFresh(false); };
    async function read() {
      if (lock.current || lost.current || !navigator.onLine) return false;
      lock.current = true; setBusy(true); setFresh(false); const epoch = generation.current;
      try { const value = await request(`${path}/preparation-routing?page=${page}`, { signal: controller.signal }, binding) as Routes; if (!alive || epoch !== generation.current) return false; setRows(value); setFresh(true); return true; }
      catch (e) { if (!alive || epoch !== generation.current) return false; if (e instanceof DashboardApiError && [401, 403, 404].includes(e.status)) clear(); else setMessage(t.conflict); return false; }
      finally { lock.current = false; if (alive) setBusy(false); }
    }
    refresh.current = read; void read();
    window.addEventListener('shida-signout', clear); window.addEventListener('shida-personal-session-changed', clear);
    const offline = () => setFresh(false); const online = () => void read();
    window.addEventListener('offline', offline); window.addEventListener('online', online);
    return () => { alive = false; guard.current++; controller.abort(); window.removeEventListener('shida-signout', clear); window.removeEventListener('shida-personal-session-changed', clear); window.removeEventListener('offline', offline); window.removeEventListener('online', online); };
  }, [path, binding, page, t]);
  useEffect(() => { const leave = (e: Event) => e.preventDefault(); window.dispatchEvent(new CustomEvent('rst-work-dirty', { detail: !!pending })); if (pending) { window.addEventListener('rst-work-leave', leave); window.addEventListener('beforeunload', leave); } return () => { window.dispatchEvent(new CustomEvent('rst-work-dirty', { detail: false })); window.removeEventListener('rst-work-leave', leave); window.removeEventListener('beforeunload', leave); }; }, [pending]);
  async function save() {
    if (lock.current || lost.current || !fresh || !navigator.onLine || !rows || !pending && (!selected || station === 'bar' && !declared)) return;
    const operation = pending ?? preparationEnvelope(`${path}/preparation-routing/${selected}`, 'PUT', { operation_key: crypto.randomUUID(), expected_updated_at: rows.revision, station, ...(station === 'bar' ? { supported_non_alcoholic_drink: true } : {}) }, binding, `${path}/preparation-routing?page=${page}`);
    const epoch = generation.current; lock.current = true; setBusy(true); setPending(operation);
    try {
      if (pending) { const current = await request(operation.detailUrl, {}, operation.binding) as Routes; if (epoch !== generation.current) return; setRows(current); }
      await request(operation.url, { method: operation.method, body: operation.body }, operation.binding);
      if (epoch !== generation.current) return;
      setPending(null); setSelected(''); setDeclared(false); setMessage('');
    } catch (e) {
      if (epoch !== generation.current) return;
      if (e instanceof DashboardApiError && [401, 403, 404].includes(e.status)) { lost.current = true; generation.current++; setAccessLost(true); setPending(null); setRows(null); setSelected(''); setDeclared(false); setMessage(t.lost); }
      else if (e instanceof DashboardApiError && [409, 422].includes(e.status)) { setPending(null); setSelected(''); setDeclared(false); setMessage(t.conflict); }
      else setMessage(t.uncertain);
    } finally { lock.current = false; if (!lost.current && epoch === generation.current) { setBusy(false); await refresh.current(); } }
  }
  return <section className="rst-work rst-preparation-routing"><h2>{t.routing}</h2><p>{t.routeHelp}</p>{message && <p role="alert">{message}</p>}<button type="button" disabled={busy || accessLost} onClick={() => void refresh.current()}>{t.refresh}</button>{pending && <button type="button" disabled={busy || !fresh} onClick={() => void save()}>{t.retry}</button>}
    {rows && <><ul>{rows.items.map(row => <li key={row.item_ref}>{row.name} — {row.station ? t[row.station] : t.unconfigured}<button type="button" disabled={busy || !fresh || !!pending} onClick={() => { setSelected(row.item_ref); setStation(row.station ?? 'kitchen'); setDeclared(false); }}>{t.routing}: {row.name}</button></li>)}</ul>{selected && <fieldset disabled={busy || !fresh || !!pending}><legend>{rows.items.find(r => r.item_ref === selected)?.name}</legend><select aria-label={t.routing} value={station} onChange={e => { setStation(e.target.value as Station); setDeclared(false); }}><option value="kitchen">{t.kitchen}</option><option value="bar">{t.bar}</option></select>{station === 'bar' && <label><input type="checkbox" checked={declared} onChange={e => setDeclared(e.target.checked)}/>{t.declaration}</label>}<button type="button" disabled={station === 'bar' && !declared} onClick={() => void save()}>{t.save}</button></fieldset>}<div className="rst-actions"><button type="button" disabled={busy || !!pending || page <= 1} onClick={() => { setSelected(''); setPage(n => n - 1); }}>{t.previous}</button><button type="button" disabled={busy || !!pending || !rows.has_more} onClick={() => { setSelected(''); setPage(n => n + 1); }}>{t.next}</button></div></>}
  </section>;
}
