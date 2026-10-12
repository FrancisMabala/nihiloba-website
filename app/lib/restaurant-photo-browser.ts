import { DashboardApiError } from './restaurant-seller-browser';
import { validPhotoEnvelope, type PhotoEnvelope } from './restaurant-photo-contract';
const url = (path: string) => { const [p, q] = path.split('?'); return `/api/shida/${p}/${q ? `?${q}` : ''}`; };
function failure(status: number, value: unknown): never {
  const detail = value && typeof value === 'object' && 'detail' in value ? String(value.detail) : undefined;
  throw new DashboardApiError(status === 409 ? 'conflict' : 'unavailable', status, detail);
}
export async function photoRequest(path: string, binding: string, signal: AbortSignal, body?: unknown): Promise<PhotoEnvelope> {
  const r = await fetch(url(path), { method: body ? 'POST' : 'GET', body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin', cache: 'no-store', signal, headers: { 'X-Shida-Session': binding, ...(body ? { 'Content-Type': 'application/json' } : {}) } });
  const value = await r.json().catch(() => null);
  if (!r.ok) failure(r.status, value);
  if (!validPhotoEnvelope(value)) failure(502, null);
  return value;
}
export async function photoPreview(path: string, binding: string, signal: AbortSignal): Promise<Blob> {
  const r = await fetch(url(`${path}/preview`), { credentials: 'same-origin', cache: 'no-store', signal, headers: { 'X-Shida-Session': binding } });
  if (!r.ok) failure(r.status, await r.json().catch(() => null));
  if (r.headers.get('content-type')?.split(';')[0] !== 'image/jpeg') failure(502, null);
  return r.blob();
}
export function uploadPhoto(path: string, binding: string, file: File, signal: AbortSignal, progress: (percent: number) => void): Promise<PhotoEnvelope> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    xhr.open('POST', url(path)); xhr.timeout = 60000; xhr.withCredentials = true;
    xhr.setRequestHeader('X-Shida-Session', binding); xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = e => { if (e.lengthComputable) progress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => { try { const value = JSON.parse(xhr.responseText); if (xhr.status < 200 || xhr.status >= 300) failure(xhr.status, value); if (!validPhotoEnvelope(value)) failure(502, null); resolve(value); } catch (e) { reject(e); } };
    xhr.onerror = xhr.ontimeout = () => reject(new DashboardApiError('unavailable', 503));
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
    xhr.onloadend = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    xhr.send(file);
  });
}
