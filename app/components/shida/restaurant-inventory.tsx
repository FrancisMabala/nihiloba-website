"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { DashboardApiError } from "@/app/lib/restaurant-seller-browser";
import "./restaurant-inventory.css";

type Item = { item_ref: string; name: string; purpose: "sellable" | "ingredient"; stock_kind: "prepared" | "packaged" | "ingredient" | null; last_changed_at: string | null; unit: string; display_label: string | null; status: string; revision: number; initialized: boolean; on_hand: string | null; reserved: string | null; available: string | null; balance_revision: number | null; low_stock: boolean; low_stock_threshold: string | null; tracking_active: boolean };
type InventoryPage = { tracking_active: boolean; total: number; items: Item[] };
type Binding = { menu_item_ref: string; item_ref: string; factor: number; revision: number; active: boolean; recount_required: boolean; reactivation_required: boolean };
type MenuItem = { public_ref: string; name: string; pricing_model: string };
type MenuPage = { result: { items: MenuItem[]; total: number } };
type History = { entries: { movement_ref: string; kind: string; quantity_effect: string; unit: string; created_at: string; balance_after: string | null }[]; next_before_id: number | null };
type Operation = { path: string; method: string; body: string };
type Props = { path: string; locale: "fr" | "en" | "ln" | "sw"; read: <T>(path: string, locale: string) => Promise<T>; perform: <T>(operation: Operation) => Promise<T> };

const copy = {
  fr: { title: "Stock", inactive: "Suivi inactif. Les ventes en periode gratuite ne sont pas deduites; recomptez et reactivez les liens avant leur usage.", empty: "Aucun article suivi.", create: "Creer un article", name: "Nom", purpose: "Type", sellable: "A vendre", ingredient: "Ingredient prive", unit: "Unite", opening: "Quantite initiale", threshold: "Seuil bas facultatif", save: "Enregistrer", available: "Disponible", reserved: "Reserve", onHand: "En stock", low: "Stock bas", select: "Choisir un article", receive: "Reception", count: "Comptage observe", waste: "Perte", quantity: "Quantite", history: "Historique prive", bind: "Lien au menu", menuItem: "Article du menu", factor: "Quantite par vente", activate: "Activer le lien", disable: "Desactiver", recount: "Recomptez avant de reactiver.", reactivate: "Reactivez ce lien apres le comptage.", refresh: "Actualiser", retry: "Reessayer la meme operation", failed: "L action n a pas ete enregistree. Actualisez et reessayez.", updated: "Stock mis a jour.", noMenu: "Aucun article a prix unitaire.", page: "Page suivante", archive: "Archiver", archiveConfirm: "Archiver cet article ?", stateActive: "Actif", stateInactive: "Inactif", note: "Le stock ne definit ni prix ni cout.", unitPiece: "Piece", unitPortion: "Portion", unitBoule: "Boule", unitBottle: "Bouteille", unitCan: "Canette", unitTray: "Plateau" },
  en: { title: "Stock", inactive: "Tracking is inactive. Free-period sales are not deducted; recount and reactivate bindings before use.", empty: "No tracked items.", create: "Create item", name: "Name", purpose: "Type", sellable: "Sellable", ingredient: "Private ingredient", unit: "Unit", opening: "Opening quantity", threshold: "Optional low-stock threshold", save: "Save", available: "Available", reserved: "Reserved", onHand: "On hand", low: "Low stock", select: "Choose an item", receive: "Receive", count: "Observed count", waste: "Waste", quantity: "Quantity", history: "Private history", bind: "Menu binding", menuItem: "Menu item", factor: "Quantity per sale", activate: "Activate binding", disable: "Disable", recount: "Recount before reactivation.", reactivate: "Reactivate this binding after counting.", refresh: "Refresh", retry: "Retry the same operation", failed: "The change was not recorded. Refresh and try again.", updated: "Stock updated.", noMenu: "No unit-priced menu item.", page: "Next page", archive: "Archive", archiveConfirm: "Archive this item?", stateActive: "Active", stateInactive: "Inactive", note: "Stock does not imply a price or cost.", unitPiece: "Piece", unitPortion: "Portion", unitBoule: "Boule", unitBottle: "Bottle", unitCan: "Can", unitTray: "Tray" },
  ln: { title: "Stock", inactive: "Bolandi etelemi. Boteki ya eleko ya ofele ekitisi stock te; tanga lisusu mpe zongisa boyokani liboso ya kosalela.", empty: "Eloko moko te ezali kolandama.", create: "Sala eloko", name: "Nkombo", purpose: "Lolenge", sellable: "Ya koteka", ingredient: "Biloko ya kolamba ya kobomba", unit: "Momekano", opening: "Motango ya ebandeli", threshold: "Ndelo ya stock moke", save: "Bomba", available: "Etikali", reserved: "Ebombami", onHand: "Na stock", low: "Stock ekiti", select: "Pona eloko", receive: "Ozwaki", count: "Motango oyo omoni", waste: "Kobeba", quantity: "Motango", history: "Lisolo ya kobomba", bind: "Boyokani na menu", menuItem: "Eloko ya menu", factor: "Motango na boteki", activate: "Zongisa boyokani", disable: "Longola boyokani", recount: "Tanga lisusu liboso ya kozongisa.", reactivate: "Zongisa boyokani nsima ya kotanga.", refresh: "Zongisa", retry: "Meka lisusu mosala kaka oyo", failed: "Mbongwana ebombami te. Zongisa mpe meka lisusu.", updated: "Stock ebongwani.", noMenu: "Eloko ya menu ya ntalo ya moko ezali te.", page: "Lokasa elandi", archive: "Bomba na lisolo", archiveConfirm: "Kobomba eloko oyo na lisolo?", stateActive: "Ezali kosala", stateInactive: "Etelemi", note: "Stock elakisaka ntalo to motuya te.", unitPiece: "Eteni", unitPortion: "Portion", unitBoule: "Boule", unitBottle: "Molangi", unitCan: "Canette", unitTray: "Plateau" },
  sw: { title: "Hisa", inactive: "Ufuatiliaji haupo. Mauzo ya kipindi cha Bure hayajapunguzwa; hesabu upya na uwashe uhusiano kabla ya matumizi.", empty: "Hakuna bidhaa inayofuatiliwa.", create: "Unda bidhaa", name: "Jina", purpose: "Aina", sellable: "Ya kuuza", ingredient: "Kiungo cha faragha", unit: "Kipimo", opening: "Kiasi cha kuanzia", threshold: "Kiwango cha chini cha hiari", save: "Hifadhi", available: "Inapatikana", reserved: "Imehifadhiwa", onHand: "Iliyopo", low: "Hisa iko chini", select: "Chagua bidhaa", receive: "Pokea", count: "Hesabu iliyoonekana", waste: "Upotevu", quantity: "Kiasi", history: "Historia ya faragha", bind: "Uhusiano wa menyu", menuItem: "Bidhaa ya menyu", factor: "Kiasi kwa kila mauzo", activate: "Washa uhusiano", disable: "Zima", recount: "Hesabu upya kabla ya kuwasha.", reactivate: "Washa tena baada ya kuhesabu.", refresh: "Onyesha upya", retry: "Rudia kitendo kilekile", failed: "Mabadiliko hayakuhifadhiwa. Onyesha upya ujaribu tena.", updated: "Hisa imesasishwa.", noMenu: "Hakuna bidhaa ya menyu yenye bei ya kipimo.", page: "Ukurasa unaofuata", archive: "Hifadhi zamani", archiveConfirm: "Hifadhi bidhaa hii zamani?", stateActive: "Inatumika", stateInactive: "Haifanyi kazi", note: "Hisa haimaanishi bei au gharama.", unitPiece: "Kipande", unitPortion: "Kipimo", unitBoule: "Boule", unitBottle: "Chupa", unitCan: "Kopo", unitTray: "Trei" },
} as const;
const extra = {
  fr: { title: "Stock", intro: "Suivez les portions, boissons et ingrédients.", search: "Rechercher un article", all: "Tous", attention: "À surveiller", out: "Épuisés", prepared: "Portions prêtes à servir", packaged: "Boissons ou unités à vendre", ingredient: "Ingrédients ou fournitures", unknown: "Type à préciser", outStatus: "Épuisé", normal: "En stock", last: "Dernier changement", threshold: "Seuil bas", noResults: "Aucun résultat.", unavailable: "Le stock est momentanément indisponible.", denied: "Vous n’avez pas accès au stock de cet établissement.", first: "Créez votre premier article avec une quantité observée.", close: "Fermer", reason: "Motif", effect: "Variation", balance: "Solde après", noHistory: "Aucun mouvement récent.", uncertain: "Résultat incertain. Reprenez exactement la même action.", stale: "Le stock a changé. Vérifiez le nouveau solde avant de recommencer.", countHelp: "Saisissez la quantité physique totale observée.", receiveHelp: "Saisissez la quantité ajoutée.", wasteHelp: "Saisissez la quantité perdue.", noExpense: "Une réception ou une perte n’enregistre aucune dépense.", untracked: "Sans solde mesuré", insufficient: "Indisponible : stock suivi insuffisant", menuHelp: "Seuls les articles reliés explicitement au menu utilisent ce stock pour les réservations et ventes." },
  en: { title: "Stock", intro: "Track portions, drinks and ingredients.", search: "Search items", all: "All", attention: "Needs attention", out: "Out of stock", prepared: "Ready-to-serve portions", packaged: "Drinks or sellable units", ingredient: "Ingredients or supplies", unknown: "Type not specified", outStatus: "Out of stock", normal: "In stock", last: "Last change", threshold: "Low threshold", noResults: "No results.", unavailable: "Stock is temporarily unavailable.", denied: "You cannot access stock for this establishment.", first: "Create your first item with an observed quantity.", close: "Close", reason: "Reason", effect: "Change", balance: "Balance after", noHistory: "No recent movements.", uncertain: "Result uncertain. Retry exactly the same action.", stale: "Stock changed. Check the new balance before trying again.", countHelp: "Enter the total physical quantity observed.", receiveHelp: "Enter the quantity added.", wasteHelp: "Enter the quantity lost.", noExpense: "Receiving stock or recording waste does not record an expense.", untracked: "No measured balance", insufficient: "Unavailable: tracked stock is insufficient", menuHelp: "Only items explicitly linked to the menu use this stock for reservations and sales." },
  ln: { title: "Stock", intro: "Landá biteni, masanga mpe biloko ya kolamba.", search: "Luka eloko", all: "Nyonso", attention: "Esengeli kotala", out: "Esili", prepared: "Biteni oyo ebongami mpo na kopesa", packaged: "Masanga to biloko ya koteka", ingredient: "Biloko ya kolamba to ya mosala", unknown: "Lolenge eyebani te", outStatus: "Esili", normal: "Ezali", last: "Mbongwana ya nsuka", threshold: "Ndelo ya moke", noResults: "Eloko moko te ezwami.", unavailable: "Stock ezali kosala te sikoyo.", denied: "Okoki kotala stock ya esika oyo te.", first: "Sala eloko ya liboso na motángo oyo omoni.", close: "Kanga", reason: "Ntina", effect: "Mbongwana", balance: "Etikali nsima", noHistory: "Mbongwana ya sika ezali te.", uncertain: "Eyebani te soki ebombami. Meká lisusu mosala kaka oyo.", stale: "Stock ebongwani. Talá motángo ya sika liboso ya komeka lisusu.", countHelp: "Komá motángo nyonso oyo omoni.", receiveHelp: "Komá motángo oyo obakisi.", wasteHelp: "Komá motángo oyo ebebi.", noExpense: "Kozwa stock to kobebisa yango ekomaka dépense te.", untracked: "Stock etángami te", insufficient: "Ezali te: stock oyo etángami ekoki te", menuHelp: "Kaka biloko oyo okangisi na menu esalelaka stock oyo mpo na kobomba mpe koteka." },
  sw: { title: "Hisa", intro: "Fuatilia vipimo, vinywaji na viungo.", search: "Tafuta bidhaa", all: "Zote", attention: "Inahitaji kuangaliwa", out: "Zimeisha", prepared: "Vipimo tayari kutolewa", packaged: "Vinywaji au bidhaa za kuuza", ingredient: "Viungo au vifaa", unknown: "Aina haijawekwa", outStatus: "Imeisha", normal: "Ipo", last: "Badiliko la mwisho", threshold: "Kiwango cha chini", noResults: "Hakuna matokeo.", unavailable: "Hisa haipatikani kwa sasa.", denied: "Huwezi kufikia hisa ya eneo hili.", first: "Unda bidhaa ya kwanza kwa kiasi ulichoona.", close: "Funga", reason: "Sababu", effect: "Mabadiliko", balance: "Salio baada", noHistory: "Hakuna mabadiliko ya hivi karibuni.", uncertain: "Matokeo hayana uhakika. Rudia kitendo kilekile.", stale: "Hisa imebadilika. Angalia salio jipya kabla ya kujaribu tena.", countHelp: "Weka kiasi chote halisi ulichoona.", receiveHelp: "Weka kiasi kilichoongezwa.", wasteHelp: "Weka kiasi kilichopotea.", noExpense: "Kupokea hisa au kurekodi upotevu hakuandiki gharama.", untracked: "Hakuna salio lililopimwa", insufficient: "Haipatikani: hisa inayofuatiliwa haitoshi", menuHelp: "Bidhaa zilizounganishwa wazi na menyu pekee ndizo hutumia hisa hii kwa uhifadhi na mauzo." },
} as const;
const unitNames = { piece: "unitPiece", portion: "unitPortion", boule: "unitBoule", bottle: "unitBottle", can: "unitCan", tray: "unitTray" } as const;
export const inventoryTitle = (locale: "fr" | "en" | "ln" | "sw") => extra[locale].title;
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
  const x = extra[locale];
  const [data, setData] = useState<InventoryPage | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "unavailable">("loading");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "attention" | "out">("all");
  const [creating, setCreating] = useState(false);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef<Operation | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [stockKind, setStockKind] = useState<"prepared" | "packaged" | "ingredient">("prepared");
  const [kindChoice, setKindChoice] = useState<"prepared" | "packaged" | "ingredient">("prepared");
  const [unit, setUnit] = useState("portion");
  const [opening, setOpening] = useState("0");
  const [threshold, setThreshold] = useState("");
  const [action, setAction] = useState("stock_received");
  const [quantity, setQuantity] = useState("");
  const [menuRef, setMenuRef] = useState("");
  const [factor, setFactor] = useState("1");
  const base = `${path}/inventory`;
  const current = data?.items.find(item => item.item_ref === selected) ?? null;
  const activeBinding = bindings.find(binding => binding.menu_item_ref === menuRef);
  const filtered = (data?.items ?? []).filter(item => item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (filter === "all" || item.status === "active" && (filter === "out" ? Number(item.available) <= 0 : item.low_stock || Number(item.available) <= 0))).sort((a,b) => Number(b.status === "active" && Number(b.available) <= 0) - Number(a.status === "active" && Number(a.available) <= 0) || Number(b.low_stock) - Number(a.low_stock) || a.name.localeCompare(b.name));
  const itemType = (item: Item) => item.stock_kind === "prepared" ? x.prepared : item.stock_kind === "packaged" ? x.packaged : item.purpose === "ingredient" ? x.ingredient : x.unknown;
  const when = (value: string | null) => value ? new Intl.DateTimeFormat({fr:"fr-FR",en:"en-GB",ln:"fr-CD",sw:"sw-KE"}[locale], {dateStyle:"medium",timeStyle:"short"}).format(new Date(value)) : "—";
  function accessLost(error: unknown) {
    const status = typeof error === "object" && error !== null && "status" in error ? Number(error.status) : 0;
    if (![401, 403, 404].includes(status)) return false;
    pending.current = null; setCanRetry(false); setData(null); setBindings([]); setMenu([]); setSelected(null); setHistory(null); setState("denied");
    return true;
  }
  async function load() {
    try {
      const first = await read<InventoryPage>(`${base}?page=1&page_size=50`, locale);
      const pages = [first];
      for (let page = 2; (page - 1) * 50 < first.total; page++) pages.push(await read<InventoryPage>(`${base}?page=${page}&page_size=50`, locale));
      setData({...first, items: pages.flatMap(result => result.items)}); setState("ready");
      const [links, food] = await Promise.allSettled([
        read<{ bindings: Binding[] }>(`${base}/bindings`, locale),
        read<MenuPage>(`${path}/menu/items?page=1&page_size=50`, locale),
      ]);
      if (links.status === "fulfilled") setBindings(links.value.bindings);
      if (food.status === "fulfilled") setMenu(food.value.result.items.filter(item => item.pricing_model === "UNIT_PRICED"));
    } catch (error) { if (!accessLost(error)) setState("unavailable"); }
  }
  useEffect(() => { queueMicrotask(() => { void load(); }); }, [path, locale]); // eslint-disable-line react-hooks/exhaustive-deps
  async function run(work: () => Promise<void>) {
    if (busy || pending.current) return;
    setBusy(true); setMessage("");
    try { await work(); await load(); if (selected) await openHistory(selected); setMessage(t.updated); }
    catch (error) {
      if (!accessLost(error)) {
        if (error instanceof DashboardApiError && error.status === 409) { pending.current = null; setCanRetry(false); await load(); setMessage(x.stale); }
        else if (error instanceof DashboardApiError && [400,422].includes(error.status)) { pending.current = null; setCanRetry(false); setMessage(t.failed); }
        else { setCanRetry(Boolean(pending.current)); setMessage(x.uncertain); }
      }
    }
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
    try { await perform(request); pending.current = null; setCanRetry(false);
      if (request.path.endsWith('/items')) { setCreating(false); setName(''); setOpening('0'); setThreshold(''); }
      else if (request.path.endsWith('/movements')) setQuantity('');
      else if (request.path.endsWith('/binding')) setMenuRef('');
      else if (request.path.endsWith('/archive')) setSelected(null);
      await load(); if (selected && !request.path.endsWith('/archive')) await openHistory(selected); setMessage(t.updated); }
    catch (error) { if (!accessLost(error)) { if (error instanceof DashboardApiError && error.status === 409) { pending.current = null; setCanRetry(false); await load(); setMessage(x.stale); } else setMessage(x.uncertain); } }
    finally { setBusy(false); }
  }
  async function create(event: FormEvent) {
    event.preventDefault();
    await run(async () => { await operation("POST", "/items", { name, purpose: stockKind === "ingredient" ? "ingredient" : "sellable", stock_kind: stockKind, unit, opening_quantity: opening, low_stock_threshold: threshold || null }); setName(""); setOpening("0"); setThreshold(""); setCreating(false); });
  }
  async function change(event: FormEvent) {
    event.preventDefault();
    if (!current?.balance_revision) return;
    await run(async () => { await operation("POST", `/items/${encodeURIComponent(current.item_ref)}/movements`, { action, amount: quantity, expected_revision: current.balance_revision }); setQuantity(""); });
  }
  async function saveBinding(active = true) {
    const itemRef = current?.item_ref;
    const saleFactor = active ? Number(factor) : activeBinding?.factor;
    if (!menuRef || !itemRef || !saleFactor || activeBinding && activeBinding.item_ref !== itemRef) return;
    await run(async () => { await operation("POST", `/menu/${encodeURIComponent(menuRef)}/binding`, { item_ref: itemRef, factor: saleFactor, expected_revision: activeBinding?.revision ?? 0, active }); });
  }
  async function openHistory(itemRef: string, beforeId?: number) {
    try { const next = await read<History>(`${base}/items/${encodeURIComponent(itemRef)}/history${beforeId ? `?before_id=${beforeId}` : ""}`, locale); setHistory(previous => beforeId && previous ? {entries:[...previous.entries,...next.entries],next_before_id:next.next_before_id} : next); }
    catch { setMessage(t.failed); }
  }
  return <section aria-label={x.title} className="rst-stock">
    <header className="rst-stock-head"><div><h2>{x.title}</h2><p>{x.intro}</p></div><div className="rst-stock-head-actions"><button type="button" disabled={busy} onClick={() => void load()}>{t.refresh}</button>{data?.tracking_active && <button type="button" className="button-primary" onClick={() => setCreating(value => !value)}>{creating ? x.close : t.create}</button>}</div></header>
    {state === "loading" && <p role="status">{t.refresh}…</p>}
    {state === "denied" && <div className="rst-stock-state" role="status">{x.denied}</div>}
    {state === "unavailable" && <div className="rst-stock-state" role="status">{x.unavailable} <button type="button" onClick={() => void load()}>{t.refresh}</button></div>}
    {data && <>
      {!data.tracking_active && <div className="rst-stock-notice" role="status">{t.inactive}</div>}
      {message && <div className="rst-stock-notice" role="status">{message} {canRetry && <button type="button" disabled={busy} onClick={() => void retry()}>{t.retry}</button>}</div>}
      {creating && <form onSubmit={create} className="rst-stock-panel"><h3>{t.create}</h3><div className="rst-stock-fields"><label>{t.name}<input required maxLength={160} value={name} onChange={event => setName(event.target.value)} /></label><label>{t.purpose}<select value={stockKind} onChange={event => { const value=event.target.value as typeof stockKind; setStockKind(value); setUnit(value === "prepared" ? "portion" : value === "packaged" ? "bottle" : "kg"); }}><option value="prepared">{x.prepared}</option><option value="packaged">{x.packaged}</option><option value="ingredient">{x.ingredient}</option></select></label><label>{t.unit}<select value={unit} onChange={event => setUnit(event.target.value)}>{(stockKind === "ingredient" ? units : units.slice(0,6)).map(value => <option key={value} value={value}>{unitLabel(value,t)}</option>)}</select></label><label>{t.opening}<input required inputMode="decimal" value={opening} onChange={event => setOpening(event.target.value)} /></label><label>{t.threshold}<input inputMode="decimal" value={threshold} onChange={event => setThreshold(event.target.value)} /></label></div><button className="button-primary" disabled={busy || canRetry} type="submit">{t.save}</button></form>}
      {data.total === 0 ? <div className="rst-stock-state"><h3>{t.empty}</h3><p>{x.first}</p></div> : <><div className="rst-stock-toolbar"><label>{x.search}<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={x.search} /></label><div className="rst-stock-filters" role="group" aria-label={x.title}>{(["all","attention","out"] as const).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{x[value]}</button>)}</div></div>
      {filtered.length === 0 ? <div className="rst-stock-state">{x.noResults}</div> : <div className="rst-stock-list">{filtered.map(item => <button key={item.item_ref} type="button" disabled={canRetry} className="rst-stock-row" aria-pressed={selected === item.item_ref} onClick={() => { setSelected(item.item_ref); setKindChoice(item.stock_kind ?? (item.purpose === "ingredient" ? "ingredient" : "prepared")); setHistory(null); void openHistory(item.item_ref); }}><span className="rst-stock-identity"><strong>{item.name}</strong><small>{itemType(item)}</small></span><span className="rst-stock-quantity"><strong>{exact(item.on_hand,item.unit)} {item.display_label || unitLabel(item.unit,t)}</strong><small>{t.available}: {exact(item.available,item.unit)}{Number(item.reserved) > 0 ? ` · ${t.reserved}: ${exact(item.reserved,item.unit)}` : ""}</small></span><span className="rst-stock-threshold"><small>{x.threshold}</small><strong>{item.low_stock_threshold === null ? "—" : `${exact(item.low_stock_threshold,item.unit)} ${item.display_label || unitLabel(item.unit,t)}`}</strong></span><span className={`rst-stock-status ${Number(item.available) <= 0 ? "is-out" : item.low_stock ? "is-low" : ""}`}>{item.status !== "active" ? t.stateInactive : Number(item.available) <= 0 ? x.outStatus : item.low_stock ? t.low : x.normal}</span><span className="rst-stock-date"><small>{x.last}</small><strong>{when(item.last_changed_at)}</strong></span></button>)}</div>}</>}
      {current && <section className="rst-stock-panel rst-stock-detail"><div className="rst-stock-detail-head"><div><h3>{current.name}</h3><p>{itemType(current)} · {t.onHand}: {exact(current.on_hand,current.unit)} {current.display_label || unitLabel(current.unit,t)} · {t.available}: {exact(current.available,current.unit)} · {t.reserved}: {exact(current.reserved,current.unit)}</p></div><button type="button" onClick={() => { setSelected(null); setHistory(null); }}>{x.close}</button></div>
        {data.tracking_active && current.status === "active" && <div className="rst-stock-classify"><label>{t.purpose}<select value={kindChoice} onChange={event => setKindChoice(event.target.value as typeof kindChoice)}>{(current.purpose === "ingredient" ? ["ingredient"] : ["prepared", "packaged"]).map(value => <option key={value} value={value}>{x[value as typeof kindChoice]}</option>)}</select></label>{kindChoice !== current.stock_kind && <button type="button" disabled={busy || canRetry} onClick={() => void run(async () => { await operation("POST", `/items/${encodeURIComponent(current.item_ref)}/kind`, { stock_kind: kindChoice, expected_revision: current.revision }); })}>{t.save}</button>}</div>}
        {data.tracking_active && current.status === "active" && <form onSubmit={change} className="rst-stock-action"><div className="rst-stock-filters" role="group" aria-label={x.reason}>{[["stock_received",t.receive],["waste",t.waste],["count",t.count]].map(([value,label]) => <button type="button" key={value} aria-pressed={action === value} onClick={() => { setAction(value); setQuantity(""); }}>{label}</button>)}</div><p>{action === "count" ? x.countHelp : action === "waste" ? x.wasteHelp : x.receiveHelp}</p><label>{t.quantity} ({current.display_label || unitLabel(current.unit,t)})<input inputMode="decimal" required value={quantity} onChange={event => setQuantity(event.target.value)} /></label><button className="button-primary" disabled={busy || canRetry} type="submit">{t.save}</button><small>{x.noExpense}</small></form>}
        <div className="rst-stock-history"><h4>{t.history}</h4>{history?.entries.length === 0 && <p>{x.noHistory}</p>}{history?.entries.map(entry => <div className="rst-stock-movement" key={entry.movement_ref}><time dateTime={entry.created_at}>{when(entry.created_at)}</time><strong>{movementLabel(locale,entry.kind)}</strong><span>{x.effect}: {Number(entry.quantity_effect) > 0 ? "+" : ""}{exact(entry.quantity_effect,entry.unit)} {unitLabel(entry.unit,t)}</span><span>{x.balance}: {exact(entry.balance_after,entry.unit)} {unitLabel(entry.unit,t)}</span></div>)}{history?.next_before_id && <button type="button" onClick={() => void openHistory(current.item_ref,history.next_before_id!)}>{t.page}</button>}</div>
        {current.purpose === "sellable" && <div className="rst-stock-menu"><h4>{t.bind}</h4><p>{x.menuHelp}</p>{bindings.filter(binding=>binding.item_ref===current.item_ref).map(binding=><p key={binding.menu_item_ref}><strong>{menu.find(item=>item.public_ref===binding.menu_item_ref)?.name ?? t.menuItem}</strong> · {binding.active ? Number(current.available) < binding.factor ? x.insufficient : t.stateActive : x.untracked}{binding.recount_required && ` · ${t.recount}`}{binding.reactivation_required && ` · ${t.reactivate}`}</p>)}{menu.length > 0 && <form onSubmit={event => { event.preventDefault(); void saveBinding(true); }} className="rst-stock-fields"><label>{t.menuItem}<select required value={menuRef} onChange={event => { const ref=event.target.value; setMenuRef(ref); const link=bindings.find(binding=>binding.menu_item_ref===ref); setFactor(String(link?.factor ?? 1)); }}><option value="">{t.select}</option>{menu.filter(item=>!bindings.some(binding=>binding.menu_item_ref===item.public_ref && binding.item_ref!==current.item_ref)).map(item=><option key={item.public_ref} value={item.public_ref}>{item.name}{!bindings.some(binding=>binding.menu_item_ref===item.public_ref && binding.active) ? ` · ${x.untracked}` : ""}</option>)}</select></label><label>{t.factor}<input required inputMode="numeric" pattern="[1-9][0-9]*" value={factor} onChange={event=>setFactor(event.target.value)} /></label><button type="submit" disabled={busy || canRetry || !menuRef}>{t.activate}</button>{activeBinding?.active && activeBinding.item_ref===current.item_ref && <button type="button" disabled={busy || canRetry} onClick={()=>void saveBinding(false)}>{t.disable}</button>}</form>}</div>}
        {data.tracking_active && current.status === "active" && <button type="button" className="rst-stock-archive" disabled={busy || canRetry} onClick={() => { if (window.confirm(t.archiveConfirm)) void run(async () => { await operation("POST", `/items/${encodeURIComponent(current.item_ref)}/archive`, { expected_revision: current.revision }); setSelected(null); }); }}>{t.archive}</button>}
      </section>}
    </>}
  </section>;
}
