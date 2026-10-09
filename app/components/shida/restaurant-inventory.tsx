"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Item = { item_ref: string; name: string; purpose: "sellable" | "ingredient"; unit: string; display_label: string | null; status: string; revision: number; initialized: boolean; on_hand: string | null; reserved: string | null; available: string | null; balance_revision: number | null; low_stock: boolean; low_stock_threshold: string | null; tracking_active: boolean };
type InventoryPage = { tracking_active: boolean; total: number; items: Item[] };
type Binding = { menu_item_ref: string; item_ref: string; factor: number; revision: number; active: boolean; recount_required: boolean; reactivation_required: boolean };
type MenuItem = { public_ref: string; name: string; pricing_model: string };
type MenuPage = { result: { items: MenuItem[]; total: number } };
type History = { entries: { movement_ref: string; kind: string; quantity_effect: string; unit: string; created_at: string }[]; next_before_id: number | null };
type Operation = { path: string; method: string; body: string };
type Props = { path: string; locale: "fr" | "en" | "ln" | "sw"; read: <T>(path: string, locale: string) => Promise<T>; perform: <T>(operation: Operation) => Promise<T> };

const copy = {
  fr: { title: "Stock numerique", inactive: "Suivi inactif. Les ventes en periode gratuite ne sont pas deduites; recomptez et reactivez les liens avant leur usage.", empty: "Aucun article suivi.", create: "Creer un article", name: "Nom", purpose: "Type", sellable: "A vendre", ingredient: "Ingredient prive", unit: "Unite", opening: "Quantite initiale", threshold: "Seuil bas facultatif", save: "Enregistrer", available: "Disponible", reserved: "Reserve", onHand: "En stock", low: "Stock bas", select: "Choisir un article", receive: "Reception", count: "Comptage observe", waste: "Perte", quantity: "Quantite", history: "Historique prive", bind: "Lien au menu", menuItem: "Article du menu", factor: "Quantite par vente", activate: "Activer le lien", disable: "Desactiver", recount: "Recomptez avant de reactiver.", reactivate: "Reactivez ce lien apres le comptage.", refresh: "Actualiser", retry: "Reessayer la meme operation", failed: "L action n a pas ete enregistree. Actualisez et reessayez.", updated: "Stock mis a jour.", noMenu: "Aucun article a prix unitaire.", page: "Page suivante", archive: "Archiver", archiveConfirm: "Archiver cet article ?", stateActive: "Actif", stateInactive: "Inactif", note: "Le stock ne definit ni prix ni cout.", unitPiece: "Piece", unitPortion: "Portion", unitBoule: "Boule", unitBottle: "Bouteille", unitCan: "Canette", unitTray: "Plateau" },
  en: { title: "Numerical stock", inactive: "Tracking is inactive. Free-period sales are not deducted; recount and reactivate bindings before use.", empty: "No tracked items.", create: "Create item", name: "Name", purpose: "Type", sellable: "Sellable", ingredient: "Private ingredient", unit: "Unit", opening: "Opening quantity", threshold: "Optional low-stock threshold", save: "Save", available: "Available", reserved: "Reserved", onHand: "On hand", low: "Low stock", select: "Choose an item", receive: "Receive", count: "Observed count", waste: "Waste", quantity: "Quantity", history: "Private history", bind: "Menu binding", menuItem: "Menu item", factor: "Quantity per sale", activate: "Activate binding", disable: "Disable", recount: "Recount before reactivation.", reactivate: "Reactivate this binding after counting.", refresh: "Refresh", retry: "Retry the same operation", failed: "The change was not recorded. Refresh and try again.", updated: "Stock updated.", noMenu: "No unit-priced menu item.", page: "Next page", archive: "Archive", archiveConfirm: "Archive this item?", stateActive: "Active", stateInactive: "Inactive", note: "Stock does not imply a price or cost.", unitPiece: "Piece", unitPortion: "Portion", unitBoule: "Boule", unitBottle: "Bottle", unitCan: "Can", unitTray: "Tray" },
  ln: { title: "Stock ya motango", inactive: "Bolandi etelemi. Boteki ya eleko ya ofele ekitisi stock te; tanga lisusu mpe zongisa boyokani liboso ya kosalela.", empty: "Eloko moko te ezali kolandama.", create: "Sala eloko", name: "Nkombo", purpose: "Lolenge", sellable: "Ya koteka", ingredient: "Biloko ya kolamba ya kobomba", unit: "Momekano", opening: "Motango ya ebandeli", threshold: "Ndelo ya stock moke", save: "Bomba", available: "Etikali", reserved: "Ebombami", onHand: "Na stock", low: "Stock ekiti", select: "Pona eloko", receive: "Ozwaki", count: "Motango oyo omoni", waste: "Kobeba", quantity: "Motango", history: "Lisolo ya kobomba", bind: "Boyokani na menu", menuItem: "Eloko ya menu", factor: "Motango na boteki", activate: "Zongisa boyokani", disable: "Longola boyokani", recount: "Tanga lisusu liboso ya kozongisa.", reactivate: "Zongisa boyokani nsima ya kotanga.", refresh: "Zongisa", retry: "Meka lisusu mosala kaka oyo", failed: "Mbongwana ebombami te. Zongisa mpe meka lisusu.", updated: "Stock ebongwani.", noMenu: "Eloko ya menu ya ntalo ya moko ezali te.", page: "Lokasa elandi", archive: "Bomba na lisolo", archiveConfirm: "Kobomba eloko oyo na lisolo?", stateActive: "Ezali kosala", stateInactive: "Etelemi", note: "Stock elakisaka ntalo to motuya te.", unitPiece: "Eteni", unitPortion: "Portion", unitBoule: "Boule", unitBottle: "Molangi", unitCan: "Canette", unitTray: "Plateau" },
  sw: { title: "Hisa ya idadi", inactive: "Ufuatiliaji haupo. Mauzo ya kipindi cha Bure hayajapunguzwa; hesabu upya na uwashe uhusiano kabla ya matumizi.", empty: "Hakuna bidhaa inayofuatiliwa.", create: "Unda bidhaa", name: "Jina", purpose: "Aina", sellable: "Ya kuuza", ingredient: "Kiungo cha faragha", unit: "Kipimo", opening: "Kiasi cha kuanzia", threshold: "Kiwango cha chini cha hiari", save: "Hifadhi", available: "Inapatikana", reserved: "Imehifadhiwa", onHand: "Iliyopo", low: "Hisa iko chini", select: "Chagua bidhaa", receive: "Pokea", count: "Hesabu iliyoonekana", waste: "Upotevu", quantity: "Kiasi", history: "Historia ya faragha", bind: "Uhusiano wa menyu", menuItem: "Bidhaa ya menyu", factor: "Kiasi kwa kila mauzo", activate: "Washa uhusiano", disable: "Zima", recount: "Hesabu upya kabla ya kuwasha.", reactivate: "Washa tena baada ya kuhesabu.", refresh: "Onyesha upya", retry: "Rudia kitendo kilekile", failed: "Mabadiliko hayakuhifadhiwa. Onyesha upya ujaribu tena.", updated: "Hisa imesasishwa.", noMenu: "Hakuna bidhaa ya menyu yenye bei ya kipimo.", page: "Ukurasa unaofuata", archive: "Hifadhi zamani", archiveConfirm: "Hifadhi bidhaa hii zamani?", stateActive: "Inatumika", stateInactive: "Haifanyi kazi", note: "Hisa haimaanishi bei au gharama.", unitPiece: "Kipande", unitPortion: "Kipimo", unitBoule: "Boule", unitBottle: "Chupa", unitCan: "Kopo", unitTray: "Trei" },
} as const;
const unitNames = { piece: "unitPiece", portion: "unitPortion", boule: "unitBoule", bottle: "unitBottle", can: "unitCan", tray: "unitTray" } as const;
export const inventoryTitle = (locale: "fr" | "en" | "ln" | "sw") => copy[locale].title;
const units = ["piece", "portion", "boule", "bottle", "can", "tray", "g", "kg", "ml", "l"];
const movementNames = {
  fr: { opening: "Ouverture", receive: "Reception", count: "Comptage", waste: "Perte", issue: "Utilisation", production: "Preparation", sale: "Vente", return: "Retour", correction: "Correction", archived: "Report historique" },
  en: { opening: "Opening", receive: "Received", count: "Count", waste: "Waste", issue: "Used", production: "Prepared", sale: "Sale", return: "Return", correction: "Correction", archived: "History checkpoint" },
  ln: { opening: "Ebandeli", receive: "Ozwaki", count: "Botangi", waste: "Kobeba", issue: "Kosalela", production: "Kolamba", sale: "Boteki", return: "Kozongisa", correction: "Kobongisa", archived: "Lisolo ya kala" },
  sw: { opening: "Mwanzo", receive: "Kupokea", count: "Hesabu", waste: "Upotevu", issue: "Matumizi", production: "Maandalizi", sale: "Mauzo", return: "Kurudisha", correction: "Marekebisho", archived: "Muhtasari wa historia" },
} as const;
function movementLabel(locale: keyof typeof movementNames, kind: string) {
  const key = kind === "opening_balance" ? "opening" : kind === "stock_received" ? "receive" : kind.startsWith("count_") ? "count" :
    ["waste", "spoilage", "damaged"].includes(kind) ? "waste" : ["manual_issue", "internal_use"].includes(kind) ? "issue" :
    kind === "preparation_produced" ? "production" : ["order_consumed", "counter_sale"].includes(kind) ? "sale" :
    kind === "return_to_stock" ? "return" : kind === "retention_checkpoint" ? "archived" : "correction";
  return movementNames[locale][key];
}
function unitLabel(unit: string, t: (typeof copy)[keyof typeof copy]) { return unit in unitNames ? t[unitNames[unit as keyof typeof unitNames]] : unit; }
function exact(value: string | null, unit: string) { return value == null ? "?" : units.slice(0, 6).includes(unit) ? String(BigInt(value.split(".")[0])) : value; }

export function RestaurantInventory({ path, locale, read, perform }: Props) {
  const t = copy[locale];
  const [page, setPage] = useState(1);
  const [data, setData] = useState<InventoryPage | null>(null);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef<Operation | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState<"sellable" | "ingredient">("sellable");
  const [unit, setUnit] = useState("piece");
  const [opening, setOpening] = useState("0");
  const [threshold, setThreshold] = useState("");
  const [action, setAction] = useState("stock_received");
  const [quantity, setQuantity] = useState("");
  const [menuRef, setMenuRef] = useState("");
  const [factor, setFactor] = useState("1");
  const [stockRef, setStockRef] = useState("");
  const base = `${path}/inventory`;
  const current = data?.items.find(item => item.item_ref === selected) ?? null;
  const activeBinding = bindings.find(binding => binding.menu_item_ref === menuRef);
  function accessLost(error: unknown) {
    const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0;
    if (![401, 403, 404].includes(status)) return false;
    pending.current = null; setCanRetry(false); setData(null); setBindings([]); setMenu([]); setSelected(null); setHistory(null);
    return true;
  }
  async function load(nextPage = page) {
    const [items, links, food] = await Promise.all([
      read<InventoryPage>(`${base}?page=${nextPage}&page_size=20`, locale),
      read<{ bindings: Binding[] }>(`${base}/bindings`, locale),
      read<MenuPage>(`${path}/menu/items?page=1&page_size=50`, locale),
    ]);
    setData(items); setBindings(links.bindings); setMenu(food.result.items.filter(item => item.pricing_model === "UNIT_PRICED")); setPage(nextPage);
    if (selected && !items.items.some(item => item.item_ref === selected)) { setSelected(null); setHistory(null); }
  }
  useEffect(() => { void load(1).catch(error => { accessLost(error); setMessage(t.failed); }); }, [path, locale]); // eslint-disable-line react-hooks/exhaustive-deps
  async function run(work: () => Promise<void>) {
    if (busy || pending.current) return;
    setBusy(true); setMessage("");
    try { await work(); await load().catch(() => undefined); setMessage(t.updated); }
    catch (error) { if (!accessLost(error)) setCanRetry(Boolean(pending.current)); setMessage(t.failed); await load().catch(() => undefined); }
    finally { setBusy(false); }
  }
  function operation(method: string, suffix: string, body: Record<string, unknown>) {
    const request = { path: `${base}${suffix}`, method, body: JSON.stringify({ ...body, operation_key: crypto.randomUUID() }) };
    pending.current = request;
    return perform(request).then(result => { pending.current = null; setCanRetry(false); return result; });
  }
  async function retry() {
    const request = pending.current;
    if (!request || busy) return;
    setBusy(true); setMessage("");
    try { await perform(request); pending.current = null; setCanRetry(false); await load().catch(() => undefined); setMessage(t.updated); }
    catch (error) { accessLost(error); setMessage(t.failed); }
    finally { setBusy(false); }
  }
  async function create(event: FormEvent) {
    event.preventDefault();
    await run(async () => { await operation("POST", "/items", { name, purpose, unit, opening_quantity: opening, low_stock_threshold: threshold || null }); setName(""); setOpening("0"); setThreshold(""); });
  }
  async function change(event: FormEvent) {
    event.preventDefault();
    if (!current?.balance_revision) return;
    await run(async () => { await operation("POST", `/items/${encodeURIComponent(current.item_ref)}/movements`, { action, amount: quantity, expected_revision: current.balance_revision }); setQuantity(""); });
  }
  async function saveBinding(active = true) {
    const itemRef = active ? stockRef : activeBinding?.item_ref;
    const saleFactor = active ? Number(factor) : activeBinding?.factor;
    if (!menuRef || !itemRef || !saleFactor) return;
    await run(async () => { await operation("POST", `/menu/${encodeURIComponent(menuRef)}/binding`, { item_ref: itemRef, factor: saleFactor, expected_revision: activeBinding?.revision ?? 0, active }); });
  }
  async function openHistory(itemRef: string, beforeId?: number) {
    try { setHistory(await read<History>(`${base}/items/${encodeURIComponent(itemRef)}/history${beforeId ? `?before_id=${beforeId}` : ""}`, locale)); }
    catch { setMessage(t.failed); }
  }
  return <section aria-label={t.title} className="rst-card rst-inventory">
    <h2>{t.title}</h2>
    <p>{t.note}</p>
    {!data && <p>{t.refresh}</p>}
    {data && <>
      {!data.tracking_active && <p role="status">{t.inactive}</p>}
      <div className="rst-actions"><button type="button" className="button button-secondary" disabled={busy} onClick={() => void load().catch(() => setMessage(t.failed))}>{t.refresh}</button></div>
      {message && <p role="status">{message}</p>}
      {canRetry && <button type="button" disabled={busy} onClick={() => void retry()}>{t.retry}</button>}
      {data.total === 0 && <p>{t.empty}</p>}
      <div className="rst-grid">{data.items.map(item => <button key={item.item_ref} type="button" className="rst-card" aria-pressed={selected === item.item_ref} onClick={() => { setSelected(item.item_ref); setHistory(null); }}>
        <strong>{item.name}</strong><span>{item.purpose === "ingredient" ? t.ingredient : t.sellable}</span><span>{t.available}: {exact(item.available, item.unit)} {item.display_label || unitLabel(item.unit, t)}</span>{item.low_stock && <strong>{t.low}</strong>}
      </button>)}</div>
      {page * 20 < data.total && <button type="button" disabled={busy} onClick={() => void load(page + 1).catch(() => setMessage(t.failed))}>{t.page}</button>}
      {current && <section className="rst-card"><h3>{current.name}</h3><p>{t.onHand}: {exact(current.on_hand, current.unit)} {current.display_label || unitLabel(current.unit, t)} · {t.reserved}: {exact(current.reserved, current.unit)}</p><p>{current.status === "active" ? t.stateActive : t.stateInactive}</p>
        {data.tracking_active && current.status === "active" && <form onSubmit={change}><label>{t.select}<select value={action} onChange={event => setAction(event.target.value)}><option value="stock_received">{t.receive}</option><option value="count">{t.count}</option><option value="waste">{t.waste}</option></select></label><label>{t.quantity} ({current.display_label || unitLabel(current.unit, t)})<input inputMode="decimal" required value={quantity} onChange={event => setQuantity(event.target.value)} /></label><button disabled={busy} type="submit">{t.save}</button></form>}
        <button type="button" disabled={busy} onClick={() => void openHistory(current.item_ref)}>{t.history}</button>
        {history && <><ul>{history.entries.map(entry => <li key={entry.movement_ref}>{new Date(entry.created_at).toLocaleString(locale)} · {movementLabel(locale, entry.kind)}: {entry.quantity_effect} {unitLabel(entry.unit, t)}</li>)}</ul>{history.next_before_id && <button type="button" onClick={() => void openHistory(current.item_ref, history.next_before_id!)}>{t.page}</button>}</>}
        {data.tracking_active && current.status === "active" && <button type="button" disabled={busy} onClick={() => { if (window.confirm(t.archiveConfirm)) void run(async () => { await operation("POST", `/items/${encodeURIComponent(current.item_ref)}/archive`, { expected_revision: current.revision }); setSelected(null); }); }}>{t.archive}</button>}
      </section>}
      {data.tracking_active && <><form onSubmit={create} className="rst-card"><h3>{t.create}</h3><label>{t.name}<input required maxLength={160} value={name} onChange={event => setName(event.target.value)} /></label><label>{t.purpose}<select value={purpose} onChange={event => setPurpose(event.target.value as "sellable" | "ingredient")}><option value="sellable">{t.sellable}</option><option value="ingredient">{t.ingredient}</option></select></label><label>{t.unit}<select value={unit} onChange={event => setUnit(event.target.value)}>{units.map(value => <option key={value} value={value}>{unitLabel(value, t)}</option>)}</select></label><label>{t.opening}<input required inputMode="decimal" value={opening} onChange={event => setOpening(event.target.value)} /></label><label>{t.threshold}<input inputMode="decimal" value={threshold} onChange={event => setThreshold(event.target.value)} /></label><button disabled={busy} type="submit">{t.save}</button></form>
      <form onSubmit={event => { event.preventDefault(); void saveBinding(true); }} className="rst-card"><h3>{t.bind}</h3>{!menu.length && <p>{t.noMenu}</p>}<label>{t.menuItem}<select required value={menuRef} onChange={event => { const ref = event.target.value; setMenuRef(ref); const link = bindings.find(b => b.menu_item_ref === ref); setStockRef(link?.item_ref ?? ""); setFactor(String(link?.factor ?? 1)); }}><option value="">{t.select}</option>{menu.map(item => <option key={item.public_ref} value={item.public_ref}>{item.name}</option>)}</select></label><label>{t.sellable}<select required value={stockRef} onChange={event => setStockRef(event.target.value)}><option value="">{t.select}</option>{data.items.filter(item => item.purpose === "sellable" && item.status === "active").map(item => <option key={item.item_ref} value={item.item_ref}>{item.name} · {unitLabel(item.unit, t)}</option>)}</select></label><label>{t.factor}<input required inputMode="numeric" pattern="[1-9][0-9]*" value={factor} onChange={event => setFactor(event.target.value)} /></label>{activeBinding?.recount_required && <p>{t.recount}</p>}{activeBinding?.reactivation_required && <p>{t.reactivate}</p>}<button disabled={busy || !menuRef || !stockRef} type="submit">{t.activate}</button>{activeBinding?.active && <button disabled={busy} type="button" onClick={() => void saveBinding(false)}>{t.disable}</button>}</form></>}
    </>}
  </section>;
}
