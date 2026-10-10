'use client';
import { useEffect, useRef, useState } from 'react';
import { request, DashboardApiError } from '../../lib/restaurant-seller-browser';
import { preparationCopy, type PreparationLocale } from '../../lib/restaurant-preparation-copy';
import { workText } from '../../lib/restaurant-work-copy';
import { preparationEnvelope, preparationPath, type Preparation, type PreparationAssignment, type Station, type StationFeed, type StationLine, type StationList, type StationOrder, type StationResult } from '../../lib/restaurant-preparation-contract';
import './restaurant-preparation.css';

type Props = { path: string; binding: string; locale: PreparationLocale; station: Station; assignment?: PreparationAssignment; orderRef?: string; onChanged?: () => void };
type Envelope = ReturnType<typeof preparationEnvelope>;
type Status = 'loading' | 'fresh' | 'stale' | 'offline' | 'lost';
export function StationStates({ preparation, state, locale }: { preparation: Preparation; state: string; locale: PreparationLocale }) {
  const t = preparationCopy[locale];
  const label = (value: string) => t[value as keyof typeof t] ?? workText(locale, value);
  return <div className="rst-station-states"><p>{t.whole}: {label(state)}</p>{(['kitchen', 'bar'] as const).map(s => preparation[s] && <p key={s}>{t[s]}: {label(preparation[s]!)}</p>)}{preparation.kitchen && preparation.bar && <p>{t.mixed}</p>}</div>;
}
export function RestaurantPreparationOwner({ preparation, onFreeOrders, ...props }: Omit<Props, 'station' | 'assignment'> & { preparation?: Preparation; onFreeOrders?: () => void }) {
  const [station, setStation] = useState<Station>(preparation?.bar && !preparation.kitchen ? 'bar' : 'kitchen');
  const [locked, setLocked] = useState(false);
  useEffect(() => { const dirty = (event: Event) => setLocked((event as CustomEvent<boolean>).detail); window.addEventListener('rst-work-dirty', dirty); return () => window.removeEventListener('rst-work-dirty', dirty); }, []);
  const t = preparationCopy[props.locale];
  return <section className="rst-preparation-owner"><h2>{t.title}</h2><div className="rst-actions">{(['kitchen', 'bar'] as const).filter(s => !props.orderRef || (preparation ? !!preparation[s] : s === 'kitchen')).map(s => <button type="button" key={s} disabled={locked} aria-pressed={station === s} onClick={() => { if (window.dispatchEvent(new Event('rst-work-leave', { cancelable: true }))) setStation(s); }}>{t[s]}</button>)}{onFreeOrders && <button type="button" disabled={locked} onClick={() => { if (window.dispatchEvent(new Event('rst-work-leave', { cancelable: true }))) onFreeOrders(); }}>{t.orders}</button>}</div><RestaurantPreparation {...props} station={station}/></section>;
}
export function RestaurantPreparation(props: Props) {
  const scope = `${props.path}:${props.binding}:${props.station}:${props.orderRef ?? ''}:${props.assignment?.assignment_ref ?? ''}:${props.assignment?.assignment_revision ?? ''}`;
  return <PreparationScope key={scope} {...props}/>;
}
function PreparationScope({ path, binding, locale, station, assignment, orderRef, onChanged }: Props) {
  const t = preparationCopy[locale];
  const base = `${path}/${assignment ? 'stations/' : ''}preparation/${station}`;
  const scoped = (url: string) => preparationPath(url, '', assignment);
  const detailUrl = (ref: string) => orderRef ? `${path}/orders/${ref}/preparation/${station}` : scoped(`${base}/orders/${ref}`);
  const [list, setList] = useState<StationList | null>(null), [detail, setDetail] = useState<StationOrder | null>(null), [page, setPage] = useState(1);
  const [status, setStatus] = useState<Status>('loading'), [busy, setBusy] = useState(false), [checked, setChecked] = useState('');
  const [pending, setPending] = useState<Envelope | null>(null), [message, setMessage] = useState(''), [review, setReview] = useState(false);
  const [confirmed, setConfirmed] = useState(false), [reason, setReason] = useState('');
  const current = useRef<StationOrder | null>(null), envelope = useRef<Envelope | null>(null), lock = useRef(false), epoch = useRef(0), lost = useRef(false);
  const refreshNow = useRef<(full?: boolean) => Promise<boolean>>(async () => false);
  const change = useRef(onChanged);
  useEffect(() => { change.current = onChanged; }, [onChanged]);
  function clear() {
    epoch.current++; lost.current = true; current.current = null; envelope.current = null;
    setList(null); setDetail(null); setPending(null); setMessage(''); setConfirmed(false); setReason(''); setChecked(''); setReview(false); setStatus('lost');
  }
  useEffect(() => {
    const guard = epoch;
    const signout = () => clear();
    window.addEventListener('shida-signout', signout); window.addEventListener('shida-personal-session-changed', signout);
    return () => { guard.current++; window.removeEventListener('shida-signout', signout); window.removeEventListener('shida-personal-session-changed', signout); };
  }, []);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('rst-work-dirty', { detail: !!pending }));
    const leave = (event: Event) => event.preventDefault();
    if (pending) { window.addEventListener('rst-work-leave', leave); window.addEventListener('beforeunload', leave); }
    return () => { window.dispatchEvent(new CustomEvent('rst-work-dirty', { detail: false })); window.removeEventListener('rst-work-leave', leave); window.removeEventListener('beforeunload', leave); };
  }, [pending]);
  useEffect(() => {
    let alive = true, cursor = '', errors = 0, timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const read = <T,>(url: string) => request(url, { signal: controller.signal }, binding) as Promise<T>;
    async function refresh(full = false): Promise<boolean> {
      if (!alive || lost.current || lock.current) return false;
      clearTimeout(timer);
      if (document.hidden || !navigator.onLine) { setStatus(navigator.onLine ? 'stale' : 'offline'); return false; }
      lock.current = true; setBusy(true); setStatus('loading'); const generation = epoch.current;
      try {
        if (!orderRef) {
          const feed = await read<StationFeed>(scoped(`${base}/feed?limit=50${cursor && !full ? `&cursor=${encodeURIComponent(cursor)}` : ''}`));
          if (!alive || generation !== epoch.current) return false;
          cursor = feed.cursor;
          const rows = await read<StationList>(scoped(`${base}/orders?page=${page}&page_size=20&language=${locale}`));
          if (!alive || generation !== epoch.current) return false;
          setList(rows); setChecked(feed.as_of);
        }
        const ref = orderRef ?? current.current?.order_ref;
        if (ref) {
          const value = await read<StationOrder>(detailUrl(ref));
          if (!alive || generation !== epoch.current) return false;
          current.current = value; setDetail(value); setChecked(value.updated_at);
        }
        errors = 0; setStatus('fresh'); return true;
      } catch (e) {
        if (!alive || generation !== epoch.current) return false;
        if (e instanceof DashboardApiError && [401, 403, 404].includes(e.status)) { clear(); return false; }
        if (e instanceof DashboardApiError && e.detail === 'restaurant_feed_refresh_required') cursor = '';
        errors++; setStatus(navigator.onLine ? 'stale' : 'offline'); return false;
      } finally {
        lock.current = false;
        if (alive) { setBusy(false); if (!lost.current && !document.hidden && navigator.onLine) timer = setTimeout(() => void refresh(), Math.min(120000, 15000 * 2 ** Math.min(errors, 3))); }
      }
    }
    refreshNow.current = refresh;
    const resume = () => { if (lost.current) return; setStatus(navigator.onLine ? 'stale' : 'offline'); cursor = ''; clearTimeout(timer); if (!document.hidden && navigator.onLine) void refresh(true); };
    void refresh(true); window.addEventListener('online', resume); window.addEventListener('offline', resume); document.addEventListener('visibilitychange', resume);
    return () => { alive = false; controller.abort(); clearTimeout(timer); window.removeEventListener('online', resume); window.removeEventListener('offline', resume); document.removeEventListener('visibilitychange', resume); };
  // Scope changes remount this component; callbacks use the current selected ref.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, locale]);
  async function open(ref: string) {
    if (lock.current || envelope.current || status !== 'fresh' || lost.current) return;
    lock.current = true; setBusy(true); const generation = epoch.current;
    try { const value = await request(detailUrl(ref), {}, binding) as StationOrder; if (generation !== epoch.current) return; current.current = value; setDetail(value); setMessage(''); setReview(false); setConfirmed(false); setReason(''); }
    catch (e) { if (generation !== epoch.current) return; if (e instanceof DashboardApiError && [401, 403, 404].includes(e.status)) clear(); else setStatus('stale'); }
    finally { lock.current = false; if (generation === epoch.current) setBusy(false); }
  }
  async function send(action?: 'start' | 'ready' | 'recover') {
    if (lock.current || lost.current || !navigator.onLine || status !== 'fresh' || review || !current.current) return;
    const previous = envelope.current;
    if (!previous && (!action || action === 'recover' && (!confirmed || !reason))) return;
    const value = current.current;
    const operation = previous ?? preparationEnvelope(action === 'recover' ? `${path}/orders/${value.order_ref}/preparation/${station}/recover` : orderRef ? `${detailUrl(value.order_ref)}/actions/${action}` : scoped(`${base}/orders/${value.order_ref}/actions/${action}`), 'POST', { operation_key: crypto.randomUUID(), expected_revision: value.revision, ...(action === 'recover' ? { confirm: true, reason } : {}) }, binding, detailUrl(value.order_ref));
    envelope.current = operation; setPending(operation); lock.current = true; setBusy(true); setMessage(''); const generation = epoch.current; let submitted = false;
    try {
      if (previous) {
        if (assignment) {
          const business = path.split('/restaurants/')[0];
          const authority = await request(`${business}/restaurants/stations/${station}/assignments?page=${assignment.bootstrap_page ?? 1}`, {}, operation.binding) as { items: (PreparationAssignment & { establishment_ref: string })[] };
          if (generation !== epoch.current) return;
          if (!authority.items.some(row => row.establishment_ref === path.split('/').at(-1) && row.assignment_ref === assignment.assignment_ref && row.assignment_revision === assignment.assignment_revision)) { clear(); return; }
        }
        const refreshed = await request(operation.detailUrl, {}, operation.binding) as StationOrder;
        if (generation !== epoch.current) return;
        current.current = refreshed; setDetail(refreshed);
      }
      submitted = true;
      const result = await request(operation.url, { method: operation.method, body: operation.body }, operation.binding) as StationResult;
      if (generation !== epoch.current) return;
      current.current = result.current_order; setDetail(result.current_order); envelope.current = null; setPending(null); setConfirmed(false); setReason(''); change.current?.();
    } catch (e) {
      if (generation !== epoch.current) return;
      if (e instanceof DashboardApiError && [401, 403, 404].includes(e.status)) clear();
      else if (e instanceof DashboardApiError && [409, 422].includes(e.status) && (!previous || submitted)) { envelope.current = null; setPending(null); setReview(true); setConfirmed(false); setReason(''); setMessage(t.conflict); setStatus('stale'); }
      else { setMessage(t.uncertain); setStatus('stale'); }
    } finally { lock.current = false; if (generation === epoch.current) { setBusy(false); await refreshNow.current(true); } }
  }
  const disabled = busy || status !== 'fresh' || !!pending || review;
  function lines(items: StationLine[]) { return <ul>{items.map(line => <li key={line.key}>{line.name} — {line.quantity !== undefined ? `${line.quantity} ${line.sale_unit_label ?? ''}` : `${t.amount}: ${line.selected_amount} ${line.currency}`}</li>)}</ul>; }
  function work(order: StationOrder) { return <><h4>{t.original}</h4>{lines(order.standalone)}{order.plates.map((plate, i) => <div key={plate.key}><h4>{t.plate} {i + 1}</h4>{lines(plate.components)}</div>)}</>; }
  return <section className="rst-work rst-preparation" aria-label={t[station]}><h3>{t[station]}</h3><button type="button" disabled={busy || status === 'lost'} onClick={() => void refreshNow.current(true)}>{t.refresh}</button>
    <p role="status">{status === 'lost' ? t.lost : status === 'offline' ? t.offline : status === 'loading' ? t.loading : status === 'stale' ? t.conflict : checked ? `${t.checked}: ${new Date(checked).toLocaleTimeString(locale === 'ln' ? 'fr' : locale)}` : ''}</p>
    {message && <p role="alert">{message}</p>}{review && detail && <button type="button" disabled={busy || status !== 'fresh'} onClick={() => { setReview(false); setMessage(''); }}>{t.review}</button>}
    {pending && <button type="button" disabled={busy || status !== 'fresh'} onClick={() => void send()}>{t.retry}</button>}
    {list && status !== 'lost' && <><div className="rst-grid">{list.items.map(row => <article className="rst-card" key={row.order_ref}><button type="button" disabled={disabled} onClick={() => void open(row.order_ref)}>{row.order_ref}</button><StationStates preparation={row.stations} state={row.state} locale={locale}/>{work(row)}</article>)}</div>{!list.items.length && <p>{t.empty}</p>}<div className="rst-actions"><button type="button" disabled={disabled || page <= 1} onClick={() => { current.current = null; setDetail(null); setPage(n => n - 1); }}>{t.previous}</button><button type="button" disabled={disabled || page * 20 >= list.total} onClick={() => { current.current = null; setDetail(null); setPage(n => n + 1); }}>{t.next}</button></div></>}
    {detail && status !== 'lost' && <article className="rst-card rst-station-detail"><h4>{detail.order_ref}</h4><StationStates preparation={detail.stations} state={detail.state} locale={locale}/><p>{t[station]}: {t[detail.station_state as keyof typeof t] ?? workText(locale, detail.station_state)}</p>{detail.legacy_whole_order && <p>{t.legacy}</p>}<p>{t.preference}: {detail.food_preference || t.none}</p>{work(detail)}<div className="rst-actions">{['waiting', 'accepted'].includes(detail.station_state) && <button type="button" disabled={disabled} onClick={() => void send('start')}>{t.start}</button>}{detail.station_state === 'preparing' && <button type="button" disabled={disabled} onClick={() => void send('ready')}>{t.markReady}</button>}</div>
      {!assignment && ['waiting', 'accepted', 'preparing'].includes(detail.station_state) && <fieldset disabled={disabled}><legend>{t.recovery} — {t[station]}</legend><label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>{t.confirm}</label><label>{t.reason}<select value={reason} onChange={e => setReason(e.target.value)}><option value="">—</option><option value="cannot_fulfill">{t.cannot_fulfill}</option><option value="other">{t.other}</option></select></label><button type="button" disabled={disabled || !confirmed || !reason} onClick={() => void send('recover')}>{t.recover}</button></fieldset>}
    </article>}
  </section>;
}
