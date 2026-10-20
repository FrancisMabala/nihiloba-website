export const wenzeDiscoveryKeys = ["query","city","area","category","store","condition","availability","currency","min_price","max_price","variant_type","variant_option","cursor"] as const;
export type WenzeDiscoverySearch = Partial<Record<typeof wenzeDiscoveryKeys[number], string>>;
export function parseWenzeDiscovery(raw: Record<string, string | string[] | undefined>): WenzeDiscoverySearch {
  const result: WenzeDiscoverySearch = {};
  for (const key of wenzeDiscoveryKeys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) result[key] = value.trim().slice(0,key==="cursor"?512:120);
  }
  return result;
}
export function wenzeDiscoveryQuery(search: WenzeDiscoverySearch, cursor?: string | null) {
  const params = new URLSearchParams();
  for (const key of wenzeDiscoveryKeys) if (key !== "cursor" && search[key]) params.set(key,search[key]!);
  const next = cursor === undefined ? search.cursor : cursor;
  if (next) params.set("cursor",next);
  return params.toString();
}
