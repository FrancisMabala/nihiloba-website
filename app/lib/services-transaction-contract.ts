// Channel routing only. Authorization and transitions stay in the Services backend.
export function transactionPath(parts: string[], method: string): string | null {
  if (parts[0] !== 'transactions') return null;
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
  return [...query].every(([key,value]) => method === 'GET' && key === 'offset' && query.getAll(key).length === 1
    && /^\d{1,6}$/.test(value) && (parts.length === 2 && ['requests','reservations'].includes(parts[1]) || parts[1] === 'requests' && parts[3] === 'quotes' || parts[1] === 'messages' && parts.length === 3));
}
export function transactionSearch(parts:string[], query:URLSearchParams): URLSearchParams {
  const result = new URLSearchParams(query);
  if (parts.length === 2 && ['requests','messages'].includes(parts[1])) result.set('provider','true');
  return result;
}
