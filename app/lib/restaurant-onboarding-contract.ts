export function onboardingBody(path: string, method: string, value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (path === 'onboarding') return method === 'POST' && Object.keys(row).every(k => ['operation_key', 'establishment_ref'].includes(k)) && typeof row.operation_key === 'string' && row.operation_key.length > 0 && row.operation_key.length <= 200 && (row.establishment_ref === undefined || typeof row.establishment_ref === 'string' && /^RST_[\w-]+$/.test(row.establishment_ref));
  if (typeof row.revision !== 'string' || !/^[a-f0-9]{64}$/.test(row.revision)) return false;
  if (path.endsWith('/confirm')) return method === 'POST' && Object.keys(row).sort().join(',') === 'confirmed,revision' && row.confirmed === true;
  if (method !== 'PATCH' || Object.keys(row).sort().join(',') !== 'fields,revision' || !row.fields || typeof row.fields !== 'object' || Array.isArray(row.fields)) return false;
  const limits: Record<string, number> = {name:200,description:4000,city:200,commune:200,quartier:200,public_address:2000,landmark:2000,timezone_name:100};
  return Object.entries(row.fields).every(([key, value]) => key === 'confirm_location' ? typeof value === 'boolean' : key === 'food_business_type' ? ['restaurant','malewa','cafe','fast_food','catering'].includes(String(value)) : key === 'address_visibility' ? ['broad','public'].includes(String(value)) : key in limits && (value === null || typeof value === 'string' && value.length <= limits[key]));
}
