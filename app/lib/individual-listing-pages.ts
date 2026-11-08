/** Read complete, authorized collections before displaying totals. Sparse pages
 * are valid: the backend cursor counts scanned records, not returned records.
 * Filters and UI pagination reuse this snapshot rather than repeating requests.
 */
export async function collectListingPages<T>(read: (offset: number) => Promise<{rows: T[]; next_offset?: number | null}>, isActive: () => boolean = () => true): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;
  for (let page = 0; page < 100; page++) {
    if (!isActive()) throw new Error("listing_session_changed");
    const result = await read(offset);
    rows.push(...result.rows);
    if (result.next_offset == null) return rows;
    if (!Number.isSafeInteger(result.next_offset) || result.next_offset <= offset) throw new Error("invalid_listing_cursor");
    offset = result.next_offset;
  }
  // Never present a truncated collection as an account-wide count.
  throw new Error("listing_page_limit");
}
