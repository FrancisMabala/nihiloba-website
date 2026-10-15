'use client';

import { useState } from 'react';
import { request, DashboardApiError } from '../../lib/restaurant-seller-browser';
import { preparationCopy, soloPreparationCopy, type PreparationLocale } from '../../lib/restaurant-preparation-copy';
import { preparationEnvelope, type ItemRoute } from '../../lib/restaurant-preparation-contract';

export type RoutingPage = { items: { item_ref: string; station: ItemRoute | null }[]; has_more: boolean; revision: string };

export function RestaurantItemRouting({ path, binding, locale, itemRef, page, route, revision, onSaved }: { path: string; binding: string; locale: PreparationLocale; itemRef: string; page: number; route: ItemRoute | null | undefined; revision: string | null; onSaved: () => Promise<void> }) {
  const t = preparationCopy[locale];
  const [choice, setChoice] = useState<ItemRoute | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<ReturnType<typeof preparationEnvelope> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const selected = choice ?? route ?? 'kitchen';
  async function save() {
    if (busy || !revision || route === undefined || selected === 'bar' && !confirmed && !pending || !navigator.onLine) return;
    const operation = pending ?? preparationEnvelope(`${path}/preparation-routing/${itemRef}`, 'PUT', { operation_key: crypto.randomUUID(), expected_updated_at: revision, station: selected, ...(selected === 'bar' ? { supported_non_alcoholic_drink: true } : {}) }, binding, `${path}/preparation-routing?page=${page}`);
    setPending(operation); setBusy(true); setMessage('');
    try {
      if (pending) {
        const current = await request(operation.detailUrl, {}, operation.binding) as RoutingPage;
        if (current.items.find(item => item.item_ref === itemRef)?.station === selected) { setPending(null); setChoice(null); setConfirmed(false); await onSaved(); return; }
      }
      await request(operation.url, { method: operation.method, body: operation.body }, operation.binding);
      setPending(null); setChoice(null); setConfirmed(false); setMessage(t.save); await onSaved();
    } catch (error) {
      if (error instanceof DashboardApiError && [401, 403, 404].includes(error.status)) { setPending(null); setChoice(null); setMessage(t.lost); }
      else if (error instanceof DashboardApiError && [409, 422].includes(error.status)) { setPending(null); setChoice(null); setMessage(t.conflict); await onSaved(); }
      else setMessage(t.uncertain);
    } finally { setBusy(false); }
  }
  return <div className="rst-item-routing" aria-label={t.routing}>
    <span>{t.routing}</span>
    <div role="group" aria-label={t.routing}>
      {(['serve', 'kitchen', 'bar'] as const).map(station => <button type="button" key={station} aria-pressed={selected === station} disabled={busy || !!pending || !revision || route === undefined} onClick={() => { setChoice(station); setConfirmed(false); setMessage(''); }}>{station === 'serve' ? soloPreparationCopy[locale].serve : t[station]}</button>)}
    </div>
    {selected === 'bar' && choice === 'bar' && !pending && <label><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/>{t.declaration}</label>}
    {route === null && <small>{t.unconfigured}</small>}
    <small>{soloPreparationCopy[locale].help}</small>
    {choice !== null && choice !== route && <button type="button" className="rst-route-save" disabled={busy || selected === 'bar' && !confirmed} onClick={() => void save()}>{t.save}</button>}
    {pending && <button type="button" disabled={busy} onClick={() => void save()}>{t.retry}</button>}
    {message && <small role="status">{message}</small>}
  </div>;
}
