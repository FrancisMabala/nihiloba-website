/** Exact references are navigation hints; all reads are authorized by the backend. */
export function serviceTransactionLink(search: string): {kind: "requests" | "reservations"; ref: string; quoteRef?: string} | null {
  const query = new URLSearchParams(search);
  if (["request", "quote", "booking"].some(key => query.getAll(key).length > 1)) return null;
  const request = query.get("request"), quote = query.get("quote"), booking = query.get("booking");
  if (booking && !request && !quote && /^RSV_[A-Za-z0-9_-]{1,28}$/.test(booking)) return {kind: "reservations", ref: booking};
  if (!booking && request && /^SWR_[A-Za-z0-9_-]{1,28}$/.test(request) && (!quote || /^SQT_[A-Za-z0-9_-]{1,28}$/.test(quote))) {
    return {kind: "requests", ref: request, ...(quote ? {quoteRef: quote} : {})};
  }
  return null;
}
