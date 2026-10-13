// Channel routing only. Authorization and transitions stay in the Services backend.
export function transactionPath(parts: string[], method: string): string | null {
  if (parts[0] !== 'transactions') return null;
  if (parts[1] === 'finance') {
    if (parts.length === 3 && parts[2] === 'totals' && method === 'GET') return 'services/finance/totals';
    if (parts.length === 5 && parts[2] === 'reservations' && /^RSV_[A-Za-z0-9_-]+$/.test(parts[3]) && parts[4] === 'totals' && method === 'GET') return `services/finance/reservations/${parts[3]}/totals`;
    if (parts.length === 3 && parts[2] === 'entries' && ['GET','POST'].includes(method)) return 'services/finance/entries';
    if (parts.length === 5 && parts[2] === 'entries' && /^(FEN|PSE)_[A-Za-z0-9_-]+$/.test(parts[3]) && parts[4] === 'corrections' && method === 'POST') return `services/finance/entries/${parts[3]}/corrections`;
    return null;
  }
  const reservation = /^RSV_[A-Za-z0-9_-]+$/;
  const bill = /^SBF_[A-Za-z0-9_-]+$/;
  if (parts[1] === 'customer' && parts[2] === 'reservations' && reservation.test(parts[3] ?? '')
      && parts[4] === 'bills' && parts.length === 5 && method === 'GET')
    return `services/customer/reservations/${parts[3]}/bills`;
  if (parts[1] === 'bills' && bill.test(parts[2] ?? '') && parts[3] === 'history'
      && parts.length === 4 && method === 'GET') return `services/bills/${parts[2]}/history`;
  if (parts[1] === 'reservations' && reservation.test(parts[2] ?? '') && parts[3] === 'bills') {
    if (parts.length === 4 && ['GET','POST'].includes(method))
      return `services/reservations/${parts[2]}/bills`;
    if (bill.test(parts[4] ?? '')) {
      if (parts.length === 5 && method === 'PATCH')
        return `services/reservations/${parts[2]}/bills/${parts[4]}`;
      if (parts.length === 6 && ['issue','replace','void'].includes(parts[5]) && method === 'POST')
        return `services/reservations/${parts[2]}/bills/${parts[4]}/${parts[5]}`;
    }
  }
  const [kind, ref, action, proposal, decision] = parts.slice(1);
  const roots: Record<string, string> = {requests:'service-requests', quotes:'service-quotes', reservations:'service-reservations', messages:'service-messages'};
  const root = roots[kind];
  if (!root || parts.length > 6) return null;
  const prefixes: Record<string,string> = {requests:'SWR',quotes:'SQT',reservations:'RSV',messages:'MSG'};
  if (!ref) return parts.length === 2 && method === 'GET' && kind !== 'quotes' ? root : null;
  if (!new RegExp(`^${prefixes[kind]}_[A-Za-z0-9_-]+$`).test(ref)) return null;
  if (parts.length === 3) return method === 'GET' || kind === 'quotes' && method === 'PATCH' ? `${root}/${ref}` : null;
  if (parts.length === 4) {
    const permitted = kind === 'requests' ? action === 'quotes' ? ['GET','POST'].includes(method) : ['review','decline'].includes(action) && method === 'POST'
      : kind === 'quotes' ? ['send','withdraw'].includes(action) && method === 'POST'
      : kind === 'messages' ? action === 'actions' && method === 'POST'
      : action === 'lifecycle' ? method === 'GET' : ['decision','reschedule-proposals'].includes(action) && method === 'POST';
    return permitted ? `${root}/${ref}/${action}` : null;
  }
  if (kind === 'reservations' && action === 'lifecycle' && parts.length === 5 && method === 'POST'
      && ['start','complete','cancel','requester_no_show','dispute'].includes(proposal)) return `${root}/${ref}/${action}/${proposal}`;
  if (kind === 'reservations' && action === 'reschedule-proposals' && parts.length === 6 && method === 'POST'
      && /^SRP_[A-Za-z0-9_-]+$/.test(proposal) && decision === 'decision') return `${root}/${ref}/${action}/${proposal}/decision`;
  return null;
}
export function transactionQuery(parts:string[], query:URLSearchParams, method:string): boolean {
  // Organization/provider scope cannot be injected through query parameters.
  if(parts[1]==='finance'&&method==='GET'&&(parts[2]==='totals'||parts[2]==='reservations'&&parts[4]==='totals')){
    const period=parts[2]==='totals', keys=period?['start_date','end_date','as_of']:['as_of'];
    return [...query].length===keys.length&&keys.every(key=>query.getAll(key).length===1&&(
      key==='as_of'?/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(query.get(key)??''):/^\d{4}-\d{2}-\d{2}$/.test(query.get(key)??'')));
  }
  return [...query].every(([key,value]) => method === 'GET' && key === 'offset' && query.getAll(key).length === 1
    && /^\d{1,6}$/.test(value) && (parts.length === 2 && ['requests','reservations'].includes(parts[1]) || parts[1] === 'requests' && parts[3] === 'quotes' || parts[1] === 'messages' && parts.length === 3 || parts[1] === 'finance' && parts.length === 3 && parts[2] === 'entries'));
}
export function transactionSearch(parts:string[], query:URLSearchParams): URLSearchParams {
  const result = new URLSearchParams(query);
  if (parts.length === 2 && ['requests','messages'].includes(parts[1])) result.set('provider','true');
  return result;
}
