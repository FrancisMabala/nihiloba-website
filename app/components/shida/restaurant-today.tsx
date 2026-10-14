'use client';

import { useCallback, useEffect, useState } from 'react';
import { request } from '../../lib/restaurant-seller-browser';
import type { RestaurantLocale } from '../../services/shida/restaurants-client';
import { workText } from '../../lib/restaurant-work-copy';

type Order = { order_ref: string; state: string; submitted_at: string; fulfillment_method: string };
type Reservation = { reservation_ref: string; state: string; starts_at: string; party_size: number };
type Snapshot = {
  pending?: { items: Order[]; total: number };
  active?: { items: Order[]; total: number };
  reservations?: { items: Reservation[]; has_more: boolean };
  upcoming?: { items: Reservation[]; has_more: boolean };
  visits?: { items: { group_ref: string; state: string }[]; has_more: boolean };
  stock?: { items: { item_ref: string; name: string; low_stock: boolean }[]; total: number };
  intake?: { intake_released: boolean };
  money?: { bill_summary?: Record<'CDF' | 'USD', { recorded_collections: string; order_value: string }>; outstanding: Record<'CDF' | 'USD', { balance_due: string }> };
};

const copy = {
  en: { title: 'Today', intro: 'The work that needs attention at this restaurant.', incoming: 'New orders', preparing: 'In preparation', visits: 'Active visits', requests: 'Reservation requests', upcoming: 'Upcoming reservations', stock: 'Low stock', money: 'Money recorded today', due: 'Still due', value: 'Order value', open: 'Open', empty: 'Nothing needs action here.', closed: 'New order intake is closed. Existing work remains available.', setting: 'Review intake setting', unavailable: 'This section could not be loaded. Refresh to try again.', refresh: 'Refresh today', setup: 'Set up your menu and intake to start selling.' },
  fr: { title: 'Aujourd’hui', intro: 'Le travail à suivre dans ce restaurant.', incoming: 'Nouvelles commandes', preparing: 'En préparation', visits: 'Visites en cours', requests: 'Demandes de réservation', upcoming: 'Réservations à venir', stock: 'Stock bas', money: 'Encaissements enregistrés aujourd’hui', due: 'Reste à payer', value: 'Valeur des commandes', open: 'Ouvrir', empty: 'Rien à traiter ici.', closed: 'La réception des nouvelles commandes est fermée. Le travail en cours reste accessible.', setting: 'Voir le réglage de réception', unavailable: 'Impossible de charger cette partie. Actualisez pour réessayer.', refresh: 'Actualiser aujourd’hui', setup: 'Configurez le menu et la réception pour commencer à vendre.' },
  ln: { title: 'Lelo', intro: 'Misala ya kolandela na restaurant oyo.', incoming: 'Bakomande ya sika', preparing: 'Ezali kobongisama', visits: 'Bapaya bazali awa', requests: 'Bosengi ya kobomba esika', upcoming: 'Esika ebombami ekoya', stock: 'Stock ekiti', money: 'Mbongo ekomami lelo', due: 'Oyo etikali kofuta', value: 'Ntalo ya bakomande', open: 'Fungola', empty: 'Mosala ya kosala ezali te awa.', closed: 'Koyamba bakomande ya sika ekangami. Mosala oyo ezali ekoki kolandama.', setting: 'Tala ndenge ya koyamba', unavailable: 'Tokoki komonisa eteni oyo te. Zongisa lisusu.', refresh: 'Zongisa ya lelo', setup: 'Bongisa menu mpe boyambi mpo na kobanda koteka.' },
  sw: { title: 'Leo', intro: 'Kazi zinazohitaji kufuatiliwa kwenye mgahawa huu.', incoming: 'Maagizo mapya', preparing: 'Yanaandaliwa', visits: 'Ziara zinazoendelea', requests: 'Maombi ya nafasi', upcoming: 'Nafasi zijazo', stock: 'Hisa iko chini', money: 'Malipo yaliyorekodiwa leo', due: 'Bado kulipwa', value: 'Thamani ya maagizo', open: 'Fungua', empty: 'Hakuna kazi ya kufanya hapa.', closed: 'Kupokea maagizo mapya kumefungwa. Kazi iliyopo bado inapatikana.', setting: 'Angalia mpangilio wa kupokea', unavailable: 'Sehemu hii haijapakiwa. Onyesha upya ujaribu tena.', refresh: 'Onyesha upya leo', setup: 'Sanidi menyu na upokeaji ili kuanza kuuza.' },
} as const;
const coverage = { en: 'Linked service bills only.', fr: 'Factures de service liées uniquement.', ln: 'Ba factures ya service oyo ekangami kaka.', sw: 'Bili za huduma zilizounganishwa pekee.' } as const;

function localDate(zone: string | null) {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: zone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch { return new Date().toISOString().slice(0, 10); }
}

export function RestaurantToday({ path, binding, locale, zone, canPrepare, canSell, canStock, canEditIntake, onOpen }: { path: string; binding: string; locale: RestaurantLocale; zone: string | null; canPrepare: boolean; canSell: boolean; canStock: boolean; canEditIntake: boolean; onOpen: (tab: string) => void }) {
  const t = copy[locale];
  const [snapshot, setSnapshot] = useState<Snapshot>({});
  const [failed, setFailed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const day = localDate(zone);
  const dateTo = new Date(`${day}T12:00:00Z`); dateTo.setUTCDate(dateTo.getUTCDate() + 8);
  const until = dateTo.toISOString().slice(0, 10);
  const load = useCallback(async (signal: AbortSignal) => {
    const reads: [keyof Snapshot, string][] = [
      ['pending', `${path}/orders?states=pending&page=1&page_size=5`],
      ['active', `${path}/orders?states=accepted&states=preparing&page=1&page_size=10`],
      ['reservations', `${path}/reservations/pending?page=1&page_size=5`],
      ['upcoming', `${path}/reservations/calendar?date_from=${day}&date_to=${until}&page=1&page_size=10`],
      ['intake', `${path}/order-configuration`],
      ...(canSell ? [['visits', `${path}/service/groups?page=1`], ['money', `${path}/service/daily/days/${day}/preview`]] as [keyof Snapshot, string][] : []),
      ...(canStock ? [['stock', `${path}/inventory?page=1&page_size=50`]] as [keyof Snapshot, string][] : []),
    ];
    const results = await Promise.allSettled(reads.map(([, url]) => request(url, { signal }, binding)));
    if (signal.aborted) return;
    const next: Snapshot = {}, errors: string[] = [];
    results.forEach((result, index) => {
      const key = reads[index][0];
      if (result.status === 'fulfilled') Object.assign(next, { [key]: result.value });
      else errors.push(key);
    });
    setSnapshot(next); setFailed(errors); setLoading(false);
  }, [path, binding, day, until, canSell, canStock]);
  useEffect(() => { const controller = new AbortController(); queueMicrotask(() => void load(controller.signal)); return () => controller.abort(); }, [load, version]);
  const card = (key: keyof Snapshot, title: string, count: number | string | null, destination: string, detail?: string) => <article className="rst-today-card" key={key}>
    <div><span className="rst-overline">{title}</span><strong>{failed.includes(key) ? '—' : loading ? '…' : count ?? '—'}</strong></div>
    <p>{failed.includes(key) ? t.unavailable : detail ?? (count === 0 || count === '0' ? t.empty : '')}</p>
    <button type="button" onClick={() => onOpen(destination)}>{t.open} <span aria-hidden="true">→</span></button>
  </article>;
  const pending = snapshot.pending?.total ?? null;
  const active = snapshot.active?.total ?? null;
  const visits = Array.isArray(snapshot.visits?.items) ? `${snapshot.visits.items.filter(group => group.state !== 'closed').length}${snapshot.visits.has_more ? '+' : ''}` : null;
  const low = Array.isArray(snapshot.stock?.items) ? `${snapshot.stock.items.filter(item => item.low_stock).length}${snapshot.stock.total > snapshot.stock.items.length ? '+' : ''}` : null;
  return <section className="rst-today" lang={locale}>
    <div className="rst-today-heading"><div><span className="rst-overline">{day}</span><h2>{t.title}</h2><p>{t.intro}</p></div><button type="button" onClick={() => { setLoading(true); setVersion(value => value + 1); }}>{t.refresh}</button></div>
    {snapshot.intake && !snapshot.intake.intake_released && <div className="rst-today-notice"><p>{t.closed}</p>{canEditIntake && <button type="button" onClick={() => onOpen('intake')}>{t.setting}</button>}</div>}
    <div className="rst-today-grid">
      {card('pending', t.incoming, pending, 'orders', snapshot.pending?.items[0] && workText(locale, snapshot.pending.items[0].state))}
      {card('active', t.preparing, active, canPrepare ? 'kitchen' : 'orders', snapshot.active?.items[0] && workText(locale, snapshot.active.items[0].state))}
      {canSell && card('visits', t.visits, visits, 'service')}
      {card('reservations', t.requests, Array.isArray(snapshot.reservations?.items) ? `${snapshot.reservations.items.length}${snapshot.reservations.has_more ? '+' : ''}` : null, 'reservations', snapshot.reservations?.items?.[0] && new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: zone || 'UTC' }).format(new Date(snapshot.reservations.items[0].starts_at)))}
      {card('upcoming', t.upcoming, Array.isArray(snapshot.upcoming?.items) ? `${snapshot.upcoming.items.filter(item => item.state === 'accepted').length}${snapshot.upcoming.has_more ? '+' : ''}` : null, 'reservations', snapshot.upcoming?.items?.find(item => item.state === 'accepted') && new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: zone || 'UTC' }).format(new Date(snapshot.upcoming.items.find(item => item.state === 'accepted')!.starts_at)))}
      {canStock && card('stock', t.stock, low, 'inventory', snapshot.stock?.items?.find(item => item.low_stock)?.name)}
    </div>
    {canSell && <section className="rst-today-money"><div><h3>{t.money}</h3><p>{snapshot.money?.bill_summary ? t.value + ': ' + ['CDF', 'USD'].map(currency => `${snapshot.money!.bill_summary![currency as 'CDF' | 'USD'].order_value} ${currency}`).join(' · ') : failed.includes('money') ? t.unavailable : t.empty}</p><small>{coverage[locale]}</small></div><div className="rst-today-currencies">{(['CDF', 'USD'] as const).map(currency => <div key={currency}><strong>{currency}</strong><p>{snapshot.money?.bill_summary?.[currency]?.recorded_collections ?? '—'}</p><small>{t.due}: {snapshot.money?.outstanding?.[currency]?.balance_due ?? '—'}</small></div>)}</div><button type="button" onClick={() => onOpen('daily')}>{t.open} →</button></section>}
  </section>;
}
