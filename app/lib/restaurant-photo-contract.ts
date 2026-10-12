export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ref = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(v);
const revision = (v: unknown): v is string => typeof v === 'string' && v.length <= 80 && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
export const photoRoutes: [RegExp, readonly string[]][] = [
  [/^RST_[A-Za-z0-9_-]{1,76}\/photo-uploads$/, ['POST']],
  [/^RST_[A-Za-z0-9_-]{1,76}\/photo-uploads\/[A-Za-z0-9_-]{1,80}$/, ['GET']],
  [/^RST_[A-Za-z0-9_-]{1,76}\/photo-uploads\/[A-Za-z0-9_-]{1,80}\/preview$/, ['GET']],
  [/^RST_[A-Za-z0-9_-]{1,76}\/photo-uploads\/[A-Za-z0-9_-]{1,80}\/attach$/, ['POST']],
];
export const isPhotoPath = (path: string) => path.includes('/photo-uploads');
export const isPhotoUpload = (path: string) => path.endsWith('/photo-uploads');
export function validPhotoQuery(path: string, query: URLSearchParams): boolean {
  if (!isPhotoUpload(path)) return query.size === 0;
  if ([...query.keys()].some(k => !['target','item_ref','expected_updated_at','operation_key'].includes(k) || query.getAll(k).length !== 1)) return false;
  const key = query.get('operation_key');
  return !!key && key.length <= 200 && revision(query.get('expected_updated_at')) && (query.get('target') === 'establishment' ? !query.has('item_ref') : query.get('target') === 'item' && ref(query.get('item_ref')));
}
export function validPhotoAttachment(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).sort().join(',') === 'confirm,expected_updated_at,item_ref,target' && v.confirm === true && revision(v.expected_updated_at) && (v.target === 'establishment' ? v.item_ref === null : v.target === 'item' && ref(v.item_ref));
}
export type PhotoEnvelope = { upload_ref: string; target: 'establishment' | 'item'; item_ref: string | null; status: 'uploading' | 'staged' | 'attached'; expires_at: string | null; revision: string };
export function validPhotoEnvelope(value: unknown): value is PhotoEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as PhotoEnvelope;
  return ref(v.upload_ref) && revision(v.revision) && ['uploading','staged','attached'].includes(v.status) && (v.expires_at === null || revision(v.expires_at)) && (v.target === 'establishment' ? v.item_ref === null : v.target === 'item' && ref(v.item_ref));
}
