// Test process only: deny all external network access, never load production credentials.
const origin = process.env.SHIDA_API_BASE_URL;
if (process.env.SCHOOL_LANDING_FIXTURES !== '1' || !/^https:\/\/school-[a-f0-9-]{36}\.fixture\.invalid$/.test(origin ?? '')) throw new Error('Isolated school fixtures required');
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.origin !== origin) {
    if (['localhost', '127.0.0.1'].includes(url.hostname)) return originalFetch(input, init);
    throw new Error('External network disabled in school fixtures');
  }
  if (url.pathname === '/api/public/education/schools') {
    const page = url.searchParams.get('page');
    if (page === '2') await new Promise(resolve => setTimeout(resolve, 5000));
    if (page === '3') return Response.json({}, { status: 503 });
    const school = { school_ref: 'SCH_TEST1234', name: 'Controlled test school', school_type_label: 'Primary school', city: 'Kinshasa', commune: 'Gombe', description: 'Synthetic public profile', verification_label: 'Reviewed identity' };
    if (page === '4') return Response.json({ items: [{ ...school, student_names: ['PRIVATE_SENTINEL'] }], next_page: null });
    return Response.json({ items: page === '5' ? [school] : [], next_page: null });
  }
  return Response.json({ detail: 'not_found' }, { status: 404 });
};
