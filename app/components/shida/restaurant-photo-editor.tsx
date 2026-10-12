'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { RestaurantLocale } from '../../services/shida/restaurants-client';
import { request, DashboardApiError } from '../../lib/restaurant-seller-browser';
import type { Establishment, Envelope, Row, Page } from '../../lib/restaurant-seller';
import { PHOTO_MAX_BYTES, PHOTO_TYPES, type PhotoEnvelope } from '../../lib/restaurant-photo-contract';
import { photoPreview, photoRequest, uploadPhoto } from '../../lib/restaurant-photo-browser';
import { photoText, type PhotoCopyKey } from '../../lib/restaurant-photo-copy';
import { useWorkDraft } from '../../lib/restaurant-work';
import { RestaurantPhoto } from './restaurant-photo';

type Selection = { target: 'establishment' | 'item'; item: Row | null; revision: string; image: string | null };
export function RestaurantPhotoEditor({ path, binding, locale, establishmentName, target, itemRef, onFailure, onBack }: { path: string; binding: string; locale: RestaurantLocale; establishmentName: string; target: 'establishment' | 'item'; itemRef?: string; onFailure: (e: unknown) => void; onBack: () => void }) {
  const t = (key: PhotoCopyKey) => photoText(locale, key);
  const [items, setItems] = useState<Row[]>([]), [chosen, setChosen] = useState(itemRef ?? '');
  const [selection, setSelection] = useState<Selection | null>(null), [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState(''), [previewUrl, setPreviewUrl] = useState('');
  const [upload, setUpload] = useState<PhotoEnvelope | null>(null), [busy, setBusy] = useState(true), [percent, setPercent] = useState(0), [previewReady, setPreviewReady] = useState(false);
  const [message, setMessage] = useState<PhotoCopyKey | null>(null), [confirmed, setConfirmed] = useState(false), [removeConfirmed, setRemoveConfirmed] = useState(false);
  const [blocked, setBlocked] = useState(false), [uncertain, setUncertain] = useState(false), [started, setStarted] = useState(false), [removalPending, setRemovalPending] = useState(false);
  const operation = useRef<string | null>(null), controller = useRef<AbortController | null>(null), alive = useRef(false), lock = useRef(false), loadGeneration = useRef(0);
  useWorkDraft(Boolean(file) && upload?.status !== 'attached' || removalPending, t('discard'));
  useEffect(() => { alive.current = true; return () => { alive.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl); }, [localUrl]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  function reset() { setFile(null); setLocalUrl(''); setPreviewUrl(''); setPreviewReady(false); setUpload(null); setConfirmed(false); setRemoveConfirmed(false); setBlocked(false); setUncertain(false); setStarted(false); setRemovalPending(false); operation.current = null; }
  function failure(e: unknown) {
    if (!alive.current) return;
    if (e instanceof DashboardApiError) {
      if ([401,403].includes(e.status)) { reset(); setSelection(null); onFailure(e); return; }
      if (e.status === 404) { reset(); setSelection(null); setMessage('expired'); return; }
      if (e.status === 409) { setBlocked(true); setMessage('stale'); return; }
      if (e.status === 429) { setMessage('rate'); return; }
      if ([413,415,422].includes(e.status)) { setBlocked(true); setMessage('invalid'); return; }
    }
    setMessage('failed');
  }
  async function run(work: (signal: AbortSignal) => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage(null); const c = new AbortController(); controller.current = c;
    try { await work(c.signal); } catch (e) { if (!c.signal.aborted) failure(e); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  async function load(ref = chosen) {
    const generation = ++loadGeneration.current;
    const parent = await request(path, {}, binding) as Establishment;
    let list: Row[] = [];
    if (target === 'item') {
      for (let page = 1; ; page++) {
        const result = await request(`${path}/menu/items?page=${page}&page_size=50`, {}, binding) as Envelope<Page<Row>>;
        list = [...list, ...result.result.items];
        if (list.length >= result.result.total || !result.result.items.length) break;
      }
    }
    const value = target === 'item' && ref ? await request(`${path}/menu/items/${encodeURIComponent(ref)}`, {}, binding) as Envelope<Row> : null;
    if (!alive.current || generation !== loadGeneration.current) return;
    setItems(list); setChosen(ref); reset();
    setSelection(target === 'establishment' ? { target, item: null, revision: parent.revision, image: parent.profile.establishment_photo_url } : value ? { target, item: value.result, revision: value.revision, image: typeof value.result.image_url === 'string' ? value.result.image_url : null } : null);
  }
  useEffect(() => { let active = true; lock.current = true; void load(itemRef ?? '').catch(e => { if(active)failure(e); }).finally(() => { if(active) { lock.current = false; if(alive.current)setBusy(false); } }); return () => { active = false; }; }, [path, binding, target, itemRef]); // eslint-disable-line react-hooks/exhaustive-deps
  async function selectFile(value?: File) {
    if (!value || !selection || started) return;
    reset();
    if (!PHOTO_TYPES.includes(value.type) || value.size > PHOTO_MAX_BYTES || !value.size) { setMessage('invalid'); return; }
    setFile(value); setLocalUrl(URL.createObjectURL(value)); setMessage(null);
  }
  async function acceptEnvelope(value: PhotoEnvelope, signal: AbortSignal) {
    if (!selection || value.target !== selection.target || value.item_ref !== (selection.item?.public_ref ?? null) || upload && upload.upload_ref !== value.upload_ref) throw new Error('Photo target mismatch');
    if (!alive.current) return;
    setUpload(value); setUncertain(false); setConfirmed(false);
    if (value.status === 'attached') { setMessage('saved'); setFile(null); setLocalUrl(''); setPreviewUrl(''); setSelection(null); return; }
    if (value.status === 'staged') {
      setMessage('preparing');
      const blob = await photoPreview(`${path}/photo-uploads/${value.upload_ref}`, binding, signal);
      if (alive.current && !signal.aborted) { setPreviewReady(false); setPreviewUrl(URL.createObjectURL(blob)); setMessage(null); }
    }
  }
  async function send(signal: AbortSignal) {
    if (!file || !selection) return;
    const query = new URLSearchParams({ target: selection.target, expected_updated_at: selection.revision, operation_key: operation.current ??= crypto.randomUUID() });
    if (selection.item) query.set('item_ref', selection.item.public_ref);
    setStarted(true); setPercent(0); setMessage('uploading');
    await acceptEnvelope(await uploadPhoto(`${path}/photo-uploads?${query}`, binding, file, signal, setPercent), signal);
  }
  async function attach(signal: AbortSignal) {
    if (!upload || !confirmed || !previewUrl || !previewReady || !selection) return;
    setUncertain(true);
    try { await acceptEnvelope(await photoRequest(`${path}/photo-uploads/${upload.upload_ref}/attach`, binding, signal, { target: upload.target, item_ref: upload.item_ref, expected_updated_at: upload.revision, confirm: true }), signal); }
    catch (e) { if (alive.current) setMessage('uncertain'); throw e; }
  }
  async function remove() {
    if (!selection?.item || !removeConfirmed) return;
    // Existing item PATCH supports explicit null. Establishment photo is read-only.
    setStarted(true); setRemovalPending(true);
    await request(`${path}/menu/items/${selection.item.public_ref}`, { method: 'PATCH', body: JSON.stringify({ expected_updated_at: selection.revision, operation_key: operation.current ??= crypto.randomUUID(), fields: { image_url: null } }) }, binding);
    if (alive.current) { await load(); setMessage('removed'); }
  }
  return <section className="rst-card rst-photo-editor" aria-label={t(target === 'item' ? 'item' : 'restaurant')}>
    <button type="button" className="rst-text-button" disabled={busy} onClick={onBack}>← {t('back')}</button>
    <h2>{t(target === 'item' ? 'item' : 'restaurant')}</h2><p>{t('optional')}</p>
    <p className="rst-photo-target">{t('target')}: <strong>{establishmentName}</strong>{selection?.item && <> / <strong>{selection.item.name}</strong></>}</p>
    {target === 'item' && <label>{t('chooseItem')}<select disabled={busy || started || !!file} value={chosen} onChange={e => { const ref = e.target.value; void run(() => load(ref)); }}><option value="">—</option>{items.map(item => <option value={item.public_ref} key={item.public_ref}>{item.name}{item.category?.name ? ` · ${item.category.name}` : ''} · {item.public_ref}</option>)}</select></label>}
    <p>{t('guidance')}</p><p role="status" aria-live="polite">{!blocked && (uncertain || removalPending && !busy) ? t('uncertain') : message ? t(message) : ''}</p>
    {busy && <progress aria-label={t('uploading')} max={100} value={message === 'uploading' && percent < 100 ? percent : undefined}/>}
    {selection?.image && !file && <><div className="rst-photo-preview"><RestaurantPhoto src={selection.image} alt={t('current')}/></div>{target === 'establishment' && <p>{t('coverRemoval')}</p>}</>}
    <fieldset disabled={busy || !selection || started} className="rst-photo-pickers"><label>{t('choose')}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void selectFile(e.target.files?.[0]); e.target.value = ''; }}/></label><label>{t('camera')}<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => { void selectFile(e.target.files?.[0]); e.target.value = ''; }}/></label></fieldset>
    {(previewUrl || localUrl) && <figure><div className="rst-photo-preview"><Image key={previewUrl || localUrl} src={previewUrl || localUrl} unoptimized alt={t(previewUrl ? 'processed' : 'preview')} width={800} height={600} onLoad={() => { if(previewUrl)setPreviewReady(true); }} onError={() => { setPreviewReady(false); setMessage('failed'); }}/></div><figcaption>{t(previewUrl ? 'processed' : 'preview')} · {selection?.item?.name || establishmentName}</figcaption></figure>}
    {upload?.status === 'staged' && previewUrl && !uncertain && !blocked && <><p>{t('visibility')}</p><label className="rst-photo-confirm"><input type="checkbox" checked={confirmed} disabled={busy || !previewReady} onChange={e => setConfirmed(e.target.checked)}/>{t('consent')}</label><button type="button" className="button button-primary" disabled={busy || !confirmed || !previewReady} onClick={() => void run(attach)}>{t('confirm')}</button></>}
    <div className="rst-actions">
      {file && !blocked && (!upload || upload.status === 'uploading') && <button type="button" className="button button-primary" disabled={busy} onClick={() => void run(send)}>{t(started ? 'retry' : 'upload')}</button>}
      {upload && upload.status !== 'attached' && !blocked && <button type="button" disabled={busy} onClick={() => void run(async signal => acceptEnvelope(await photoRequest(`${path}/photo-uploads/${upload.upload_ref}`, binding, signal), signal))}>{t('recover')}</button>}
      {file && !uncertain && <button type="button" disabled={busy} onClick={() => { reset(); setMessage('discarded'); }}>{t('discard')}</button>}
      {(blocked || !selection && upload?.status !== 'attached') && <button type="button" disabled={busy} onClick={() => void run(() => load())}>{t('restart')}</button>}
    </div>
    {selection?.item && selection.image && !file && !blocked && <div className="rst-photo-remove"><label className="rst-photo-confirm"><input type="checkbox" checked={removeConfirmed} disabled={busy || started} onChange={e => setRemoveConfirmed(e.target.checked)}/>{t('removeConfirm')}</label><button type="button" disabled={busy || !removeConfirmed} onClick={() => void run(remove)}>{t(removalPending ? 'retryRemoval' : 'remove')}</button></div>}
  </section>;
}
