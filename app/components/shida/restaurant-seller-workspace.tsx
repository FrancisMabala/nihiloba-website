"use client";
import {restaurantWorkspaceGroups} from '../../lib/restaurant-workspace-navigation';
import {RestaurantFocus,restaurantStart} from "./restaurant-focus";
import {RestaurantCounterOptions} from "./restaurant-counter-options";
import {RestaurantBottomNavigation} from "./restaurant-bottom-navigation";
import {SellerWorkspaceIdentity, SellerWorkspaceNavigation, SellerWorkspaceHeading, type SellerNavigationItem} from "./seller-workspace";
import { RestaurantInsights } from './restaurant-insights';
import { insightsCopy } from '../../lib/restaurant-insights-copy';
import './restaurant-insights.css';
import { RestaurantSettings } from './restaurant-settings';
import { settingsCopy } from '../../lib/restaurant-settings-copy';
import { managementCopy } from "../../lib/restaurant-management-copy";
import { RestaurantPhoto } from "./restaurant-photo";
import { RestaurantPhotoEditor } from "./restaurant-photo-editor";
import { photoText } from "../../lib/restaurant-photo-copy";
import { PrivateMenuPreview } from './restaurant-projection';

import Link from "next/link";
import {marketplaceEntryCopy} from "@/app/lib/marketplace-entry-copy";
import {restaurantPath} from "@/app/lib/restaurant-i18n";
import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { DashboardApiError } from "@/app/lib/restaurant-seller-browser";
import type { RestaurantLocale } from "@/app/services/shida/restaurants-client";
import { RestaurantSharing } from "./restaurant-seller-sharing";
import { restaurantText } from "@/app/lib/restaurant-seller-copy";
import { sellerDesignCopy } from "@/app/lib/restaurant-seller-design-copy";
import { basicText } from "@/app/lib/restaurant-basic-copy";
import { localInstant, performRestaurant as perform, pricing, readRestaurant as read, rootPath, type Closure, type Envelope, type Establishment, type Fields, type Hours, type Kind, type Operation, type Page, type Row, type Window } from "@/app/lib/restaurant-seller";
import "./restaurant-seller.css";
import { RestaurantOrderScreen } from './restaurant-order-screen';
import { RestaurantReservationCalendarSeller } from './restaurant-reservation-calendar-seller';

import { RestaurantSellerReviews } from './restaurant-seller-reviews';
import { restaurantReviewCopy } from '@/app/lib/restaurant-review-copy';
import {RestaurantService} from './restaurant-service';
import {RestaurantMoneyRecovery,RestaurantPaymentMethods} from './restaurant-money';
import {RestaurantDaily} from './restaurant-daily';
import { RestaurantCounter } from './restaurant-counter';
import { RestaurantInventory } from './restaurant-inventory';
import { RestaurantIntake } from './restaurant-intake';
import { RestaurantGuestAutoAccept } from './restaurant-guest-auto-accept';

import { RestaurantMenuBatch } from './restaurant-menu-batch';
import { leaveWork, useWorkDraft } from '@/app/lib/restaurant-work';
import { LocalTime } from './restaurant-local-time';
import { workText } from '@/app/lib/restaurant-work-copy';
import { workflowText } from '@/app/lib/restaurant-workflow-copy';
import { RestaurantToday } from './restaurant-today';
import { RestaurantItemRouting, type RoutingPage } from './restaurant-item-routing';
import { RestaurantPersonalMenu } from './restaurant-personal-menu';
import { personalMenuCopy } from '@/app/lib/restaurant-personal-menu-copy';

const profileKeys = ["name", "description", "food_business_type", "city", "commune", "quartier", "public_address", "landmark", "address_visibility", "timezone_name", "opening_information", "service_modes", "logo_url", "logo_secure_url"];
const itemKeys = ["name", "description", "image_url", "category_ref", "presentation", "pricing_model", "currency", "sale_unit_label", "unit_price", "allowed_amounts", "minimum_amount", "amount_mode", "amount_step", "visible", "availability", "permanent"];
const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
type Editor = { kind: Kind; path: string; method: string; readPath: string; revision: string; operationKey: string; fields: Record<string, string>; changed: string[]; windows: Window[]; closures: Closure[]; target?: string; operation?: Operation; blocked?: boolean; latest?: { revision: string; value: Fields }; };
function strings(value: Fields, keys: string[]) { return Object.fromEntries(keys.map(key => [key, Array.isArray(value[key]) ? (value[key] as string[]).join("; ") : String(value[key] ?? "")])); }
const options: Record<string, string[]> = { amount_mode: ["configured", "flexible"], food_business_type: ["restaurant", "malewa", "cafe", "fast_food", "catering"], address_visibility: ["broad", "public"], presentation: ["fixed_dish", "component"], pricing_model: ["UNKNOWN", "UNIT_PRICED", "AMOUNT_PRICED"], currency: ["CDF", "USD"], availability: ["available", "sold_out", "temporarily_unavailable"] };
const boolKeys = ["visible", "permanent", "confirm", "confirm_location", "known"];

export function RestaurantWorkspace({ binding, locale }: { binding: string; locale: RestaurantLocale }) {
  const t = (key: string) => ["amount_mode","amount_step","configured","flexible"].includes(key) ? basicText(locale,key) : restaurantText(locale, key);
  const design = sellerDesignCopy[locale];
  const management = managementCopy[locale];
  const entry = marketplaceEntryCopy[locale], setup = entry.restaurants;
  const menuCopy = personalMenuCopy[locale];
  const [settingsGeneration, setSettingsGeneration] = useState(0);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const wt = (key:string) => workText(locale,key);
  const readRestaurant = <T,>(path: string, language: string) => read<T>(path, language, binding);
  const performRestaurant = <T,>(operation: Operation) => perform<T>(operation, binding);
  const root = rootPath();
  const [photoTarget, setPhotoTarget] = useState<{target: "establishment" | "item"; itemRef?: string}>({target:"establishment"});
  const [list, setList] = useState<Page<Establishment> | null>(null), [page, setPage] = useState(1), [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Establishment | null>(null), [tab, setTab] = useState("today"), [kitchenAvailable,setKitchenAvailable]=useState(false),[posAvailable,setPosAvailable]=useState(false);
  const [rows, setRows] = useState<Row[]>([]), [rowPage, setRowPage] = useState(1), [rowTotal, setRowTotal] = useState(0);
  const [routingPage, setRoutingPage] = useState<RoutingPage | null>(null);
  const [menuFresh, setMenuFresh] = useState(true), [stockBindings, setStockBindings] = useState<{menu_item_ref:string;item_ref:string;active:boolean}[]|null>(null), [datedOfferings, setDatedOfferings] = useState<Row[]|null>(null);
  const [menuLoadError, setMenuLoadError] = useState(false);
  const [publicAvailability, setPublicAvailability] = useState<Record<string,string>|null>(null);
  const [hours, setHours] = useState<Hours | null>(null), [preview, setPreview] = useState<Fields | null>(null);
  const [choices, setChoices] = useState<Row[]>([]), [editor, setEditor] = useState<Editor | null>(null);
  useWorkDraft(Boolean(editor), wt('discard'));
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [denied, setDenied] = useState(false);
  const alive = useRef(true), gate = useRef(false);
  const path = selected ? `${root}/${encodeURIComponent(selected.public_ref)}` : root;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { if (!editor) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [editor]);
  useEffect(() => { const stale = () => { if (document.visibilityState === 'hidden' || !navigator.onLine) setMenuFresh(false); }; document.addEventListener('visibilitychange', stale); window.addEventListener('offline', stale); return () => { document.removeEventListener('visibilitychange', stale); window.removeEventListener('offline', stale); }; }, []);

  function error(caught: unknown, mutation = false) {
    if (!alive.current) return;
    if (caught instanceof DashboardApiError) {
      if ([401, 403, 404].includes(caught.status)) {
        setDenied(true); setList(null); setSelected(null); setRows([]); setHours(null); setPreview(null); setChoices([]); setEditor(null);
        setMessage(caught.status === 401 ? "unauthorized" : "denied"); return;
      }
      if (caught.kind === "conflict") { setEditor(old => old ? { ...old, blocked: true } : null); setMessage("conflict"); return; }
      if (caught.kind === "validation") { setEditor(old => old ? { ...old, operation: undefined } : null); setMessage(caught.detail ?? "validation"); return; }
    }
    setMessage(mutation ? "uncertain" : "unavailable");
  }
  const workFailure = useCallback((caught:unknown) => error(caught), []);
  async function run(work: () => Promise<void>, mutation = false) {
    if (gate.current) return;
    gate.current = true; setBusy(true); setMessage("");
    try { await work(); } catch (caught) { error(caught, mutation); }
    finally { gate.current = false; if (alive.current) setBusy(false); }
  }
  async function loadList(nextPage = page, status = filter, enter = false) {
    const value = await readRestaurant<Page<Establishment>>(`${root}?page=${nextPage}&page_size=20${status ? `&status=${status}` : ""}`, locale);
    if (!Array.isArray(value.items) || !Number.isSafeInteger(value.total) || value.total < value.items.length || !Array.isArray(value.actions)) throw new Error("Invalid restaurant access");
    if (alive.current) { setList(value); setPage(nextPage); setFilter(status); }
    if (enter) {
      const ref=new URLSearchParams(window.location.search).get('establishment');
      if(ref) await select(ref);
      else if(value.total===1&&value.items.length===1)await select(value.items[0].public_ref);
    }
  }
  useEffect(() => { void run(() => loadList(1, "", true)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function select(ref: string, initialTab = "today") {
    const value = await readRestaurant<Establishment>(`${root}/${encodeURIComponent(ref)}`, locale);
    const availability = await readRestaurant<{capabilities:{capability:string;available:boolean}[]}>(`${root}/${encodeURIComponent(ref)}/capabilities`, locale).catch(()=>null);
    if(initialTab==='today'&&restaurantStart(`${root}/${encodeURIComponent(ref)}`)==='sell')initialTab=availability?.capabilities.some(entry=>entry.capability==='restaurant.pos'&&entry.available)?'pos':'counter';
    const kitchen = availability?.capabilities.some(entry=>entry.capability==='restaurant.kitchen'&&entry.available) ?? false;
    const menu = initialTab === "items" ? await readRestaurant<Envelope<Page<Row>>>(`${root}/${encodeURIComponent(ref)}/menu/items?page=1&page_size=20`, locale) : null;
    const routes = initialTab === "items" ? await readRestaurant<RoutingPage>(`${root}/${encodeURIComponent(ref)}/preparation-routing?page=1`, locale).catch(() => null) : null;
    if (alive.current) { setSelected(value); setCapabilities(availability?.capabilities.filter(entry=>entry.available).map(entry=>entry.capability) ?? []); setKitchenAvailable(kitchen);setPosAvailable(availability?.capabilities.some(entry=>entry.capability==='restaurant.pos'&&entry.available)??false); setTab(initialTab); setRows(menu?.result.items ?? []); setRoutingPage(routes); setRowPage(1); setRowTotal(menu?.result.total ?? 0); setHours(null); setPreview(null); }
  }
  async function loadTab(next: string, nextPage = 1, leavingEditor = false) {
    if((next!==tab || next==='settings') && !leavingEditor && !leaveWork())return;
    if(next==='pos'||next==='service'||next==='paymentMethods'||next==='daily'){const value=await readRestaurant<{capabilities:{capability:string;available:boolean}[]}>(`${path}/capabilities`,locale);const allowed=value.capabilities.some(entry=>entry.capability==='restaurant.pos'&&entry.available);setPosAvailable(allowed);setTab(next==='service'?next:allowed?next:'counter');return;}
    if (next === "settings") { await select(selected!.public_ref, "settings"); setSettingsGeneration(value=>value+1); return; }
    if (next === "profile") { await select(selected!.public_ref, "profile"); return; }
    if (["today","orders","reservations","counter","inventory","intake","activity","batch","reviews","photos","recovery"].includes(next)) { setTab(next); return; }
    if (next === 'kitchen' || next === 'routing') {setTab('orders');return;}
    if (next === "sharing") { setTab(next); return; }
    if (next === "preview") { const value = await readRestaurant<Establishment>(`${path}/preview`, locale); if (alive.current) { setPreview(value.preview ?? {}); setTab(next); } return; }
    if (next === "hours") { const value = await readRestaurant<Envelope<Hours>>(`${path}/hours`, locale); if (alive.current) { setHours(value.result); setTab(next); } return; }
    if (next === 'items') {
      try {
      const [items, routes, bindings, offerings, publicItems] = await Promise.all([
        allChoices('items'),
        allRoutes().catch(() => null),
        capabilities.includes('restaurant.inventory') ? readRestaurant<{bindings:{menu_item_ref:string;item_ref:string;active:boolean}[]}>(`${path}/inventory/bindings`, locale).catch(() => null) : Promise.resolve(null),
        allChoices('offerings').catch(() => null),
        selected?.status === 'active' ? currentPublicMenu(selected.public_ref).catch(() => null) : Promise.resolve(null),
      ]);
      if (alive.current) { setRows(items); setRoutingPage(routes); setStockBindings(bindings?.bindings ?? null); setDatedOfferings(offerings); setPublicAvailability(publicItems); setRowTotal(items.length); setRowPage(1); setMenuFresh(true); setMenuLoadError(false); setTab(next); }
      } catch (caught) {
        if (alive.current) { setTab(next); setMenuFresh(false); setMenuLoadError(true); }
        throw caught;
      }
      return;
    }
    const value = await readRestaurant<Envelope<Page<Row>>>(`${path}/menu/${next}?page=${nextPage}&page_size=20`, locale);
    if (alive.current) { setRows(value.result.items); setRoutingPage(null); setRowTotal(value.result.total); setRowPage(nextPage); setTab(next); }
  }
  async function allChoices(kind: string) {
    const result: Row[] = []; let next = 1;
    for (;;) {
      const data = await readRestaurant<Envelope<Page<Row>>>(`${path}/menu/${kind}?page=${next}&page_size=50`, locale);
      result.push(...data.result.items); if (result.length >= data.result.total || !data.result.items.length) return result; next++;
    }
  }
  async function allRoutes() {
    const items: RoutingPage['items'] = []; let page = 1; let revision = '';
    for (;;) {
      const value = await readRestaurant<RoutingPage>(`${path}/preparation-routing?page=${page}`, locale);
      items.push(...value.items); revision = value.revision;
      if (!value.has_more) return { items, has_more: false, revision };
      page++;
    }
  }
  async function currentPublicMenu(ref: string) {
    const availability: Record<string,string> = {}; let loaded = 0;
    for (let page = 1; ; page++) {
      const response = await fetch(`/api/shida/restaurant-menus/${encodeURIComponent(ref)}?language=${locale}&page=${page}`, {cache:'no-store',credentials:'same-origin'});
      if (!response.ok) throw new Error('public menu');
      const value = await response.json() as {items:{public_ref:string;availability:string}[];total:number};
      if (!Array.isArray(value.items) || !Number.isSafeInteger(value.total) || value.total < 0 || value.items.some(item=>typeof item.public_ref!=='string' || !['available','sold_out','temporarily_unavailable'].includes(item.availability))) throw new Error('public menu');
      for (const item of value.items) availability[item.public_ref] = item.availability;
      loaded += value.items.length;
      if (loaded >= value.total || !value.items.length) return availability;
    }
  }
  async function open(kind: Kind, row?: Row) {
    let values: Fields = {}, revision = "", readPath = path, editPath = path, method = "PATCH";
    let currentCurrency = selected?.menu_currency;
    let windows: Window[] = [], closures: Closure[] = [];
    if (kind === "create") { editPath = root; readPath = root; method = "POST"; values = { name: "", food_business_type: "restaurant" }; }
    else if (kind === "profile" || kind === "publish" || kind === "unpublish") {
      const current = await readRestaurant<Establishment>(path, locale); revision = current.revision; values = current.profile;
      if (kind !== "profile") { editPath = `${path}/lifecycle/${kind}`; method = "POST"; }
      if (alive.current) setSelected(current);
    } else {
      if (kind === "items" || kind === "offerings") { const data = await allChoices(kind === "items" ? "categories" : "items"); if (alive.current) setChoices(data); }
      const base = kind === "hours" ? `${path}/hours` : `${path}/menu/${kind === "copy" ? "offerings" : kind}`;
      readPath = row ? `${base}/${encodeURIComponent(row.public_ref)}` : kind === "hours" ? base : path;
      if (row || kind === "hours") {
        const current = await readRestaurant<Envelope<Fields>>(readPath, locale); values = current.result; revision = current.revision; currentCurrency = current.currency;
      } else { const current = await readRestaurant<Establishment>(path, locale); revision = current.revision; currentCurrency = current.menu_currency; if (alive.current) setSelected(current); }
      editPath = kind === "copy" || !row ? base : readPath;
      method = kind === "hours" ? "PUT" : row && kind !== "copy" ? "PATCH" : "POST";
      if (kind === "hours") { const current = values as Hours; windows = current.schedule?.windows ?? []; closures = current.exceptional_closures ?? []; values = { known: current.schedule !== null }; }
    }
    let f = strings(values, kind === "profile" ? profileKeys : kind === "items" ? itemKeys : ["name", "visible", "availability", "starts_at", "ends_at", "item_ref", "food_business_type", "known"]);
    if (kind === "items") f = { ...f, category_ref: (values.category as Row | undefined)?.public_ref ?? "", presentation: String(values.presentation ?? "fixed_dish"), pricing_model: String(values.pricing_model ?? "UNKNOWN"), amount_mode: String(values.amount_mode ?? "configured"), currency: String(values.currency ?? currentCurrency ?? "CDF"), visible: String(values.visible ?? true), permanent: String(values.permanent ?? true), availability: String(values.availability ?? (row ? "available" : "temporarily_unavailable")) };
    if (kind === "categories") f.visible = String(values.visible ?? true);
    if (kind === "offerings" || kind === "copy") f = { ...f, item_ref: (values.item as Row | undefined)?.public_ref ?? "", starts_at: kind === "copy" ? "" : localInstant(values.starts_at, selected?.profile.timezone_name ?? null), ends_at: kind === "copy" ? "" : localInstant(values.ends_at, selected?.profile.timezone_name ?? null), visible: String(values.visible ?? true), availability: String(values.availability ?? "available") };
    if (alive.current) setEditor({ kind, path: editPath, method, readPath, revision, operationKey: crypto.randomUUID(), fields: f, changed: [], windows: structuredClone(windows), closures: structuredClone(closures), target: row?.public_ref });
  }
  function change(key: string, value: string) { setEditor(old => old ? { ...old, fields: { ...old.fields, [key]: value }, changed: [...new Set([...old.changed, key])], operation: undefined } : null); }
  function itemDestination(next: 'inventory'|'offerings'|'photos') {
    if (!editor?.target || !leaveWork()) return;
    if (next === 'photos') setPhotoTarget({target:'item',itemRef:editor.target});
    setEditor(null);
    void run(()=>loadTab(next,1,true));
  }
  function changeHours(value: { windows?: Window[]; closures?: Closure[] }) {
    setEditor(old => old ? { ...old, ...value, changed: [...new Set([...old.changed, ...Object.keys(value)])] } : null);
  }
  function payload(e: Editor): Fields {
    const f = e.fields, fields: Fields = {};
    if (e.kind === "create") return { name: f.name.trim(), food_business_type: f.food_business_type, ...Object.fromEntries(["city", "commune", "quartier"].filter(k => f[k]).map(k => [k, f[k]])) };
    if (e.kind === "publish" || e.kind === "unpublish") return {};
    if (e.kind === "hours") return { confirm: f.confirm === "true", ...(e.changed.some(key => ["known", "windows"].includes(key)) ? { windows: f.known === "true" ? e.windows : null } : {}), ...(e.changed.includes("closures") ? { closures: e.closures } : {}) };
    if (e.kind === "copy") return { copy_from: e.target, starts_at: f.starts_at, ends_at: f.ends_at };
    const keys = e.kind === "profile" ? e.changed : e.method === "POST" ? e.kind === "categories" ? ["name", "visible"] : e.kind === "items" ? itemKeys : ["item_ref", "starts_at", "ends_at", "visible", "availability", "confirm"] : e.changed;
    for (const key of keys) {
      if (boolKeys.includes(key)) fields[key] = f[key] === "true";
      else if (key !== "known") fields[key] = f[key] === "" ? null : f[key];
    }
    // The domain requires both local boundaries whenever either is changed.
    if (e.kind === "offerings" && e.changed.some(key => ["starts_at", "ends_at"].includes(key))) {
      fields.starts_at = f.starts_at; fields.ends_at = f.ends_at;
    }
    if (e.kind === "items" && (e.method === "POST" || e.changed.some(key => ["pricing_model", "currency", "sale_unit_label", "unit_price", "allowed_amounts", "minimum_amount", "amount_mode", "amount_step"].includes(key)))) {
      const normalized = pricing(f);
      // A model change deliberately replaces its pricing tuple. An individual
      // amount edit must not round-trip unrelated (possibly redacted) fields.
      if (e.method === "POST" || (e.changed.includes("pricing_model") || e.changed.includes("amount_mode"))) Object.assign(fields, normalized);
      else for (const key of e.changed) if (key in normalized) fields[key] = normalized[key];
    }
    return fields;
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (gate.current || !editor || editor.blocked) return;
    if (!navigator.onLine) { setMessage("unavailable"); return; }
    if (!editor.operation && (['hours','publish','unpublish'].includes(editor.kind) || editor.kind==='profile' && editor.changed.some(key=>['service_modes','timezone_name'].includes(key)))) {
      const c=settingsCopy[locale];
      if (!window.confirm(`${c.confirm}\n${c.hoursHelp}\n${c.reservationHelp}\n${c.preserved}`)) return;
    }
    const original = editor;
    let operation = editor.operation;
    if (!operation) {
      try {
        const fields = payload(editor);
        if (!Object.keys(fields).length && !["publish", "unpublish"].includes(editor.kind)) { setMessage("validation"); return; }
        const body = editor.kind === "create" ? { ...fields, operation_key: editor.operationKey } : ["publish", "unpublish"].includes(editor.kind) ? { expected_updated_at: editor.revision } : { expected_updated_at: editor.revision, fields, ...(editor.kind === "profile" ? {} : { operation_key: editor.operationKey }) };
        operation = Object.freeze({ path: `${editor.path}?language=${locale}`, method: editor.method, body: JSON.stringify(body) });
      } catch { setMessage("restaurant_menu_invalid"); return; }
      setEditor(old => old ? { ...old, operation } : null);
    }
    const pending = operation;
    await run(async () => {
      const result = await performRestaurant<Establishment | Envelope<Row>>(pending);
      if (!alive.current) return;
      setEditor(null); setMessage("saved");
      // A committed write remains saved even if a subsequent refresh fails.
      try {
        if (original.kind === "create") { await select((result as Establishment).public_ref); await loadList(); }
        else if (["profile", "publish", "unpublish"].includes(original.kind)) setSelected(result as Establishment);
        else if (original.kind === 'items' && !original.target) { await loadTab('items'); await open('items', (result as Envelope<Row>).result); }
        else { await loadTab(original.kind === "copy" ? "offerings" : original.kind); }
      } catch (caught) { error(caught); }
    }, true);
  }
  async function reloadCurrent() {
    if (!editor) return;
    const e = editor;
    if (e.kind === "create") { await loadList(); if (alive.current) setEditor(old => old ? { ...old, blocked: true, latest: undefined } : null); return; }
    const current = await readRestaurant<Establishment | Envelope<Fields>>(e.readPath, locale);
    if (!alive.current) return;
    const value = "result" in current ? current.result : current.profile;
    setEditor(old => old ? { ...old, blocked: true, latest: { revision: current.revision, value } } : null);
    setMessage("conflict");
  }
  function reconcile() {
    setEditor(old => {
      if (!old?.latest) return old;
      const value = old.latest.value;
      const fresh: Fields = { ...value };
      if (value.category) fresh.category_ref = (value.category as Row).public_ref;
      if (old.kind === "offerings") {
        fresh.starts_at = localInstant(value.starts_at, selected?.profile.timezone_name ?? null);
        fresh.ends_at = localInstant(value.ends_at, selected?.profile.timezone_name ?? null);
      }
      const tuple = (old.changed.includes("pricing_model") || old.changed.includes("amount_mode")) ? ["currency", "unit_price", "sale_unit_label", "allowed_amounts", "minimum_amount", "amount_mode", "amount_step"] : [];
      const unchanged = Object.keys(old.fields).filter(key => key in fresh && !old.changed.includes(key) && !tuple.includes(key));
      const fields = { ...old.fields, ...strings(fresh, unchanged) };
      let windows = old.windows, closures = old.closures;
      if (old.kind === "hours") {
        const current = value as Hours;
        if (!old.changed.includes("known")) fields.known = String(current.schedule !== null);
        if (!old.changed.includes("windows")) windows = current.schedule?.windows ?? [];
        if (!old.changed.includes("closures")) closures = current.exceptional_closures;
        fields.confirm = "false";
      }
      return { ...old, fields, windows, closures, revision: old.latest.revision, operationKey: crypto.randomUUID(), operation: undefined, blocked: false, latest: undefined };
    });
    setMessage("unsaved");
  }
  function display(value: unknown, key?: string): string {
    if (value == null || value === "") return "—";
    if (typeof value === "boolean") return t(value ? "yes" : "no");
    if (Array.isArray(value)) return value.map(item => display(item)).join("; ");
    if (typeof value === "object") return Object.entries(value as Fields).filter(([key]) => !["public_ref", "updated_at", "establishment_ref", "public_detail_url", "confirmed_at"].includes(key)).map(([key, val]) => `${t(key)}: ${display(val, key)}`).join(" · ");
    if (key === "weekday" && typeof value === "number") return t(weekdays[value]);
    return key && ["amount_mode", "status", "state", "availability", "pricing_model", "presentation", "food_business_type", "address_visibility", "opening_status"].includes(key) ? t(String(value)) : String(value);
  }
  function details(value: Fields, keys: string[]) { return <dl className="rst-details">{keys.filter(key => key in value).map(key => <div key={key}><dt>{t(key)}</dt><dd>{display(value[key], key)}</dd></div>)}</dl>; }
  function input(key: string, required = false) {
    if (!editor) return null;
    const value = editor.fields[key] ?? "";
    if (key === 'service_modes') {
      const modes=value.split(',').map(mode=>mode.trim()).filter(Boolean);
      return <fieldset key={key}><legend>{t(key)}</legend><p>{settingsCopy[locale].profileHelp}</p><label><input type="checkbox" checked={modes.some(mode=>mode.toLowerCase()==='eat_there')} onChange={event=>change(key,[...modes.filter(mode=>mode.toLowerCase()!=='eat_there'),...(event.target.checked?['eat_there']:[])].join(','))}/>{settingsCopy[locale].seated}</label><p>{settingsCopy[locale].intakeHelp}</p></fieldset>;
    }
    const choicesForKey = key === "category_ref" || key === "item_ref" ? choices : undefined;
    return <label key={key}>{(key === "minimum_amount" && editor.fields.amount_mode === "flexible" ? basicText(locale,"minimumRequired") : ["amount_mode","amount_step"].includes(key)?basicText(locale,key):t(key))}{boolKeys.includes(key) ? <input type="checkbox" checked={value === "true"} required={required} onChange={event => change(key, String(event.target.checked))} /> : choicesForKey ? <select required={required} value={value} onChange={event => change(key, event.target.value)}><option value="">—</option>{choicesForKey.map(row => <option key={row.public_ref} value={row.public_ref}>{row.name}</option>)}</select> : key === 'timezone_name' ? <select required={required} value={value} onChange={event=>change(key,event.target.value)}><option value="">&mdash;</option>{[...new Set([value,...Intl.supportedValuesOf('timeZone')])].filter(Boolean).map(zone=><option key={zone} value={zone}>{zone.split('/').slice(1).join(' / ').replaceAll('_',' ')} ({zone.split('/')[0]})</option>)}</select> : options[key] ? <select required={required} value={value} onChange={event => change(key, event.target.value)}><option value="">—</option>{options[key].map(option => <option key={option} value={option}>{(["configured","flexible"].includes(option)?basicText(locale,option):t(option))}</option>)}</select> : ["description", "opening_information", "service_modes"].includes(key) ? <textarea required={required} maxLength={4000} value={value} onChange={event => change(key, event.target.value)} /> : ["starts_at", "ends_at"].includes(key) ? <LocalTime value={value} timezone={selected?.profile.timezone_name ?? null} locale={locale} required={required} onChange={v=>change(key,v)}/> : <input required={required} name={key} type={key.includes("url") ? "url" : "text"} inputMode={["unit_price", "minimum_amount"].includes(key) ? "decimal" : "text"} maxLength={key === "name" ? 200 : 2000} value={value} onChange={event => change(key, event.target.value)} />}</label>;
  }
  const button = (label: string, action: () => void, disabled = false) => <button type="button" className="button button-secondary" disabled={busy || disabled} onClick={action}>{t(label)}</button>;
  if (denied) return <section className="rst container section"><p role="alert">{t(message)}</p><Link href={`${locale === "en" ? "" : `/${locale}`}/shida/seller/restaurants`}>{t("review")}</Link></section>;
  if (!list && !selected) return <section className="rst container section"><p role={message ? "alert" : "status"}>{t(message || "loading")}</p>{message && <button disabled={busy} onClick={()=>void run(()=>loadList(1,"",true))}>{t("reload")}</button>}</section>;
  if (list?.total === 0 && !filter && !selected) return <section className="rst container section rst-seller-setup seller-setup">
    <h1>{setup.title}</h1><p>{setup.note}</p><p>{entry.separate}</p>
    {(busy || message) && <p role={message && message !== "saved" ? "alert" : "status"}>{t(busy ? "loading" : message)}</p>}
    {editor?.kind === "create" ? <form onSubmit={submit} className="rst-card rst-editor" aria-label={t("create")}>
      <fieldset disabled={busy || Boolean(editor.operation) || editor.blocked} className="rst-fields">{input("name",true)}{input("food_business_type",true)}{["city","commune","quartier"].map(key=>input(key))}</fieldset>
      <div className="rst-editor-actions"><button className="button button-primary" disabled={busy || editor.blocked}>{t(editor.operation ? "retry" : "create")}</button>
      {(editor.operation || editor.blocked) && button("reload",()=>void run(reloadCurrent))}
      {button(editor.operation || editor.blocked ? "discard" : "cancel",()=>{setEditor(null);setMessage("");})}</div>
    </form> : list.actions?.includes("create") ? <button className="button button-primary" disabled={busy} onClick={()=>void open("create")}>{setup.create}</button> : <p role="alert">{t("denied")}</p>}
    <p><Link href={restaurantPath(locale)} onClick={event=>{if(!leaveWork())event.preventDefault();}}>{entry.browse}</Link></p>
  </section>;
  const groups: {label:string; entries:[string,string][]}[] = [
    {label:management.work,entries:[["today",management.work],["orders",wt("orders")]]},
    {label:management.selling,entries:[[posAvailable ? "pos" : "counter",management.selling]]},
    {label:management.stock,entries:capabilities.includes('restaurant.inventory') ? [["inventory",management.stock]] : []},
    {label:workflowText(locale,'finances'),entries:[...(posAvailable ? [["daily",workflowText(locale,'finances')] as [string,string]] : []),["recovery",workflowText(locale,'recovery')]]},
    {label:insightsCopy[locale].title,entries:[["activity",insightsCopy[locale].title]]},
    {label:management.reservations,entries:[["reservations",management.reservations]]},
    {label:management.menu,entries:selected?.actions.includes('menu') ? [["items",design.menu],["offerings",design.daily]] : []},
    {label:management.settings,entries:[["settings",management.settings],["profile",design.profile],...(selected?.actions.includes('hours') ? [["hours",design.hours] as [string,string]] : []),["intake",wt("intake")],["reviews",restaurantReviewCopy[locale].reviews],...(selected?.actions.includes('links') ? [["sharing",design.sharing] as [string,string]] : [])]},
  ];
  const icons:Record<string,SellerNavigationItem["icon"]>={today:"overview",orders:"work",pos:"finance",counter:"finance",inventory:"stock",daily:"finance",recovery:"finance",activity:"reports",reservations:"calendar",items:"catalog",offerings:"calendar",settings:"settings",profile:"profile",hours:"calendar",intake:"settings",reviews:"work",sharing:"document"};
  const navigation=groups.flatMap(group=>group.entries.map(([key,label])=>({key,label,icon:icons[key],active:key==="items"&&["categories","batch"].includes(tab)||key===(posAvailable?"pos":"counter")&&tab==="service"})));
  return <section className="rst container rst-management seller-workspace" aria-label={t("restaurants")}>
    <div className={selected ? 'rst-management-layout seller-layout' : ''}>
    {selected && <aside className="rst-management-sidebar seller-sidebar"><SellerWorkspaceIdentity mark="R" title={t("restaurants")} subtitle={management.workspace}/><div id="restaurant-navigation" className="rst-desktop-groups">{restaurantWorkspaceGroups(locale).map((group,i)=><details className="rst-desktop-group" key={group.label} open={i===0||group.keys.includes(tab)}><summary>{group.label}</summary><SellerWorkspaceNavigation className="rst-management-nav" label={group.label} items={navigation.filter(item=>group.keys.includes(item.key))} current={tab} disabled={busy||Boolean(editor)} onNavigate={key=>void run(()=>loadTab(key))}/></details>)}</div></aside>}
    <div className="rst-management-content seller-content">
    {selected&&!editor&&<RestaurantFocus key={path} path={path} tab={tab} locale={locale} name={selected.profile.name??t("restaurants")}/>}
    {selected&&!editor&&<RestaurantBottomNavigation locale={locale} tab={tab} sell={posAvailable?"pos":"counter"} disabled={busy} items={navigation} onOpen={key=>void run(()=>loadTab(key))}/>}
    {!selected && <SellerWorkspaceHeading eyebrow={management.workspace} title={management.choose}/>}
    {selected && !editor && <div className="rst-context-actions">{list && list.total > 1 && <button disabled={busy} onClick={()=>{if(!leaveWork())return;setSelected(null);setPreview(null);void run(()=>loadList(1,""));}}>{design.change}</button>}</div>}
    <p role={message && message !== "saved" && message !== "unsaved" ? "alert" : "status"} aria-live="polite">{busy ? t(editor?.operation ? "saving" : "loading") : message ? t(message) === "—" ? t("validation") : t(message) : editor ? t("unsaved") : ""}</p>
    {editor ? <form onSubmit={submit} className={`rst-card rst-editor${editor.kind === "items" ? " rst-portion-editor" : ""}`} aria-label={t(editor.kind)}>
      <div className="rst-editor-main"><h2>{editor.kind === "items" ? editor.fields.name || t(editor.kind) : t(editor.kind)}</h2>
      <p>{t("editingScope")}</p>
      {editor.kind === "profile" && <><p>{t("locationHelp")}</p><p>{t("timezoneHelp")}</p></>}
      {editor.kind === "items" && <p>{editor.target ? menuCopy.editHelp : menuCopy.createHelp}</p>}
      {["offerings", "copy", "hours"].includes(editor.kind) && <><p>{t("timezone_name")}: {selected?.profile.timezone_name ?? t("unknown")}</p><p>{t("timeHelp")}</p></>}
      {editor.kind === "copy" && <p>{t("copyHelp")}</p>}
      {editor.kind === "offerings" && editor.target && <p>{t("dateConfirmation")}</p>}
      <fieldset disabled={busy || Boolean(editor.operation) || editor.blocked} className="rst-fields">
        {editor.kind === "create" && <>{input("name", true)}{input("food_business_type", true)}{["city", "commune", "quartier"].map(key => input(key))}</>}
        {editor.kind === "profile" && <>{profileKeys.map(key => input(key, ["name", "description", "city", "commune", "quartier"].includes(key) && editor.changed.includes(key)))}{input("confirm_location", editor.changed.some(key => ["public_address", "landmark", "address_visibility"].includes(key)))}</>}
        {editor.kind === "categories" && <>{input("name", true)}{input("visible")}</>}
        {editor.kind === "items" && <><div className="rst-wide">{input("name", true)}</div><fieldset className="rst-pricing-model rst-wide"><legend>{design.sell}</legend>{[["UNIT_PRICED", design.unit], ["AMOUNT_PRICED", design.amount], ["UNKNOWN", design.unknown]].map(([value, label]) => <label key={value}><input type="radio" name="pricing_model" checked={editor.fields.pricing_model === value} onChange={() => change("pricing_model", value)}/>{label}</label>)}</fieldset>{editor.fields.pricing_model !== "UNKNOWN" && input("currency", true)}{editor.fields.pricing_model === "UNIT_PRICED" && <>{input("sale_unit_label", true)}{input("unit_price", true)}</>}{editor.fields.pricing_model === "AMOUNT_PRICED" && <>{input("amount_mode",true)}{editor.fields.amount_mode === "flexible" ? <>{input("minimum_amount",true)}{input("amount_step")}</> : <div className="rst-amounts"><p>{t("allowed_amounts")}</p>{(editor.fields.allowed_amounts || "").split(/;\s*/).map((amount, index, amounts) => <div className="rst-amount-row" key={index}><label><span className="sr-only">{t("allowed_amounts")} {index + 1}</span><input required inputMode="decimal" value={amount} onChange={event => change("allowed_amounts", amounts.map((item, i) => i === index ? event.target.value : item).join(";"))}/></label><span>{editor.fields.currency}</span><button type="button" aria-label={`${t("remove")} ${index + 1}`} disabled={amounts.length === 1} onClick={() => change("allowed_amounts", amounts.filter((_, i) => i !== index).join(";"))}>×</button></div>)}<button type="button" className="rst-text-button" onClick={() => change("allowed_amounts", `${editor.fields.allowed_amounts || ""};`)}>+ {design.amounts}</button><p className="rst-field-help">{design.portionHelp}</p>{input("minimum_amount")}</div>}</>}{editor.target ? input("availability", true) : <p className="rst-wide">{menuCopy.unavailable}: {t("temporarily_unavailable")}</p>}{input("visible")}<details className="rst-wide rst-extra-fields" open={editor.method === "POST" || !editor.fields.category_ref}><summary>{design.extras}</summary><div className="rst-fields">{input("category_ref", true)}{input("presentation", true)}{input("description")}{input("permanent")}<p className="rst-wide">{menuCopy.photoHelp}</p></div></details></>}
        {(editor.kind === "offerings" || editor.kind === "copy") && <>{editor.kind === "offerings" && !editor.target && input("item_ref", true)}{input("starts_at", true)}{input("ends_at", true)}{editor.kind === "offerings" && <>{input("visible")}{input("availability", true)}{input("confirm", !editor.target)}</>}</>}
        {editor.kind === "hours" && <div className="rst-wide"><p>{t("hoursHelp")}</p>{input("known")}<h3>{t("windows")}</h3>{editor.fields.known === "true" && <>{editor.windows.map((window, index) => <div className="rst-row" key={index}><label>{t("weekday")}<select value={window.weekday} onChange={event => changeHours({ windows: editor.windows.map((w, i) => i === index ? { ...w, weekday: Number(event.target.value) } : w) })}>{weekdays.map((day, i) => <option key={day} value={i}>{t(day)}</option>)}</select></label>{(["start", "end"] as const).map(key => <label key={key}>{t(key)}<input type="time" required value={window[key]} onChange={event => changeHours({ windows: editor.windows.map((w, i) => i === index ? { ...w, [key]: event.target.value } : w) })} /></label>)}{window.end <= window.start && <span>{wt('overnight')}</span>}{button("remove", () => changeHours({ windows: editor.windows.filter((_, i) => i !== index) }))}</div>)}{button("addWindow", () => changeHours({ windows: [...editor.windows, { weekday: 0, start: "09:00", end: "17:00" }] }))}</>}<p>{wt('splitHelp')}</p><h3>{t("closures")}</h3>{editor.closures.map((closure, index) => <div className="rst-row" key={index}>{closure.confirmed_at ? <p>{localInstant(closure.starts_at, closure.timezone_name ?? null)} — {localInstant(closure.ends_at, closure.timezone_name ?? null)}</p> : (["starts_at", "ends_at"] as const).map(key => <label key={key}>{t(key)}<LocalTime value={closure[key]} timezone={selected?.profile.timezone_name ?? null} locale={locale} onChange={value => changeHours({ closures: editor.closures.map((c, i) => i === index ? { ...c, [key]: value } : c) })} /></label>)}{button("remove", () => changeHours({ closures: editor.closures.filter((_, i) => i !== index) }))}</div>)}{button("addClosure", () => changeHours({ closures: [...editor.closures, { starts_at: "", ends_at: "" }] }))}{input("confirm", true)}</div>}
        {["publish", "unpublish"].includes(editor.kind) && <div><p>{t("publication")}: {t(editor.kind)} · {selected?.profile.name}</p>{input("confirm", true)}</div>}
      </fieldset>
      {editor.latest && <aside className="rst-current"><h3>{t("latest")}</h3>{details(editor.latest.value, [...profileKeys, ...itemKeys.filter(k => !profileKeys.includes(k)), "starts_at", "ends_at", "state", "schedule", "exceptional_closures"])}</aside>}
      <div className="rst-actions">
        <button className="button button-primary" disabled={busy || editor.blocked}>{t(editor.operation ? "retry" : editor.kind === "create" ? "create" : "save")}</button>
        {(editor.blocked || editor.operation) && button("reload", () => void run(reloadCurrent))}
        {editor.latest && button("reconcile", reconcile)}
        {button(editor.operation || editor.blocked ? "discard" : "cancel", () => { setEditor(null); setMessage(""); })}
      </div>
      {editor.kind === "create" && editor.blocked && list && <div>{list.items.map(row => <p key={row.public_ref}>{row.profile.name} · {t(row.status)}</p>)}</div>}
      </div>{editor.kind === "items" && <aside className="rst-portion-help">{editor.target&&editor.fields.pricing_model==="UNIT_PRICED"&&<fieldset disabled={editor.changed.length>0||Boolean(editor.operation)}><RestaurantCounterOptions key={editor.target} path={path} itemRef={editor.target} binding={binding} locale={locale} onSaved={()=>{setEditor(null);void run(()=>loadTab("items"));}}/></fieldset>}<h3>{menuCopy.preparation}</h3>{editor.target ? <><fieldset className="rst-routing-fieldset" disabled={editor.changed.length>0 || Boolean(editor.operation)}><RestaurantItemRouting key={editor.target} path={path} binding={binding} locale={locale} itemRef={editor.target} page={Math.floor(Math.max(0,routingPage?.items.findIndex(item=>item.item_ref===editor.target)??0)/20)+1} route={routingPage?.items.find(item=>item.item_ref===editor.target)?.station} revision={routingPage?.revision??null} onSaved={async()=>{await loadTab('items');await open('items',{public_ref:editor.target!});}}/></fieldset>{editor.changed.length>0&&<p>{menuCopy.saveDetailsFirst}</p>}<p>{menuCopy.stockHelp}</p><p>{menuCopy.stock}: {stockBindings?.find(value=>value.menu_item_ref===editor.target)?.item_ref??menuCopy.noStock}</p><p>{menuCopy.datedHelp}</p><p>{menuCopy.dated}: {datedOfferings ? datedOfferings.filter(value=>value.item?.public_ref===editor.target&&value.state!=='expired').length||menuCopy.noDated : menuCopy.datedUnknown}</p><div className="rst-menu-editor-links"><button type="button" onClick={()=>itemDestination('offerings')}>{menuCopy.dated}</button>{capabilities.includes('restaurant.inventory')&&<button type="button" onClick={()=>itemDestination('inventory')}>{menuCopy.stock}</button>}<button type="button" onClick={()=>itemDestination('photos')}>{management.photo}</button></div></> : <p>{menuCopy.createHelp}</p>}</aside>}
    </form> : <>
      {!selected ? <><div className="rst-actions"><label>{t("establishments")}<select value={filter} disabled={busy} onChange={event => void run(() => loadList(1, event.target.value))}><option value="">{t("all")}</option>{["draft", "active", "inactive"].map(status => <option key={status} value={status}>{t(status)}</option>)}</select></label>{list?.actions?.includes("create") && button("add", () => void run(() => open("create")))}{button("reload", () => void run(() => loadList()))}</div><div className="rst-grid">{list?.items.map(row => <article className="rst-card" key={row.public_ref}><h2>{row.profile.name}</h2><p>{t(row.status)}</p>{button("edit", () => void run(() => select(row.public_ref)))}</article>)}</div>{list && !list.items.length && <p>{t("empty")}</p>}<div className="rst-actions">{button("previous", () => void run(() => loadList(page - 1)), page <= 1)}{button("next", () => void run(() => loadList(page + 1)), !list || page * 20 >= list.total)}</div></> : <>

        {tab === "categories" && <div className="rst-menu-heading"><h2>{design.menuTitle}</h2><div className="rst-actions"><button type="button" className="rst-text-button" disabled={busy} onClick={() => void run(() => open(tab as Kind))}>+ {design.add}</button>{button("categories", () => void run(() => loadTab(tab === "categories" ? "items" : "categories")))}<button type="button" disabled={busy} onClick={()=>void run(()=>loadTab("batch"))}>{photoText(locale,"batch")}</button></div></div>}
        {tab === 'photos' && <RestaurantPhotoEditor key={`${path}:${photoTarget.target}:${photoTarget.itemRef ?? ''}`} path={path} binding={binding} locale={locale} establishmentName={selected.profile.name || t('restaurants')} {...photoTarget} onFailure={workFailure} onBack={() => void run(() => loadTab(photoTarget.target === 'establishment' ? 'profile' : 'items'))}/>}
        {tab === 'settings' && <RestaurantSettings key={`${path}:${binding}:${settingsGeneration}`} path={path} binding={binding} locale={locale} establishment={selected} capabilities={capabilities} onOpen={next=>void run(()=>loadTab(next))} onFailure={workFailure}/>}
        {tab === 'today' && <RestaurantToday path={path} binding={binding} locale={locale} zone={selected.profile.timezone_name} canPrepare={kitchenAvailable} canSell={posAvailable} canStock={capabilities.includes('restaurant.inventory')} canEditIntake={selected.actions.includes('edit')} onOpen={next=>void run(()=>loadTab(next==='kitchen'?'orders':next))}/>}
        {tab === 'orders'  && <RestaurantOrderScreen key={path} path={path} binding={binding} locale={locale} timezone={selected.profile.timezone_name} onFailure={workFailure} onIntake={selected.actions.includes('edit')?()=>void run(()=>loadTab('intake')):undefined} onSelling={()=>void run(()=>loadTab(posAvailable?'pos':'counter'))}/>}
        {tab === 'reservations' && <RestaurantReservationCalendarSeller key={`${path}:${binding}`} path={path} binding={binding} locale={locale} seated={selected.profile.service_modes?.split(',').some(mode=>mode.trim().toLowerCase()==='eat_there')??false} capable={capabilities.includes('restaurant.reservations')} onSettings={()=>void run(()=>loadTab('settings'))} onHours={()=>void run(()=>loadTab('hours'))}/>}
        {tab === 'reviews' && <RestaurantSellerReviews key={path} path={path} binding={binding} locale={locale}/>}
        {tab === 'service' && posAvailable && <RestaurantService key={path+binding} path={path} binding={binding} locale={locale}/>}
        {tab === 'recovery' && <RestaurantMoneyRecovery key={path+binding} path={path} binding={binding} locale={locale}/>}
        {tab === 'paymentMethods' && <RestaurantPaymentMethods key={path+binding} path={path} binding={binding} locale={locale}/>}
        {tab === 'daily' && posAvailable && <RestaurantDaily key={path+binding} path={path} binding={binding} locale={locale} profileZone={selected.profile.timezone_name} onOpenBill={()=>void run(()=>loadTab('recovery'))} onOpenMethods={()=>void run(()=>loadTab('paymentMethods'))}/>}
        {tab === 'pos' && <RestaurantCounter key={`${path}/pos`} path={path} binding={binding} locale={locale} onFailure={workFailure} pos onFreeCounter={()=>{setPosAvailable(false);setTab('counter');}}/>}
        {tab === 'counter' && <RestaurantCounter key={path} path={path} binding={binding} locale={locale} onFailure={workFailure}/>}
        {tab === 'inventory' && <RestaurantInventory key={path} path={path} locale={locale} read={readRestaurant} perform={performRestaurant}/>}
        {tab === 'intake' && <><RestaurantIntake key={path} path={path} binding={binding} locale={locale} timezone={selected.profile.timezone_name} onOpen={next=>void run(()=>loadTab(next))} onFailure={workFailure}/><RestaurantGuestAutoAccept path={path} binding={binding} locale={locale} onFailure={workFailure}/></>}
        {tab === 'activity' && <RestaurantInsights key={`${path}:${binding}`} path={path} binding={binding} locale={locale} timezone={selected.profile.timezone_name} onFailure={workFailure}/>}
        {tab === 'batch' && <RestaurantMenuBatch key={path} path={path} binding={binding} locale={locale} onFailure={workFailure}/>}
        {tab === "profile" && <article className="rst-card">{list?.actions?.includes("create") && <div className="rst-actions"><button type="button" disabled={busy} onClick={()=>void run(()=>open("create"))}>{t("add")}: {management.establishment}</button></div>}<div className="rst-profile-photo"><div className="rst-photo-thumb"><span>{management.noPhoto}</span><RestaurantPhoto src={selected.profile.establishment_photo_url} alt={selected.profile.name || ''} sizes="80px"/></div><div><h2>{design.profile}</h2>{selected.actions.includes('edit') && <button type="button" disabled={busy} onClick={()=>{if(!leaveWork())return;setPhotoTarget({target:'establishment'});setTab('photos');}}>{management.photo}</button>}</div></div><p>{t(selected.status)}</p>{selected.actions.includes("preview") && button("preview",()=>void run(()=>loadTab("preview")))}{details(selected.profile, profileKeys)}<p>{t("location_confirmed")}: {t(selected.location_confirmed ? "yes" : "no")}</p>{selected.missing_publication_fields.length > 0 && <p>{t("missing")}: {selected.missing_publication_fields.map(t).join(", ")}</p>}<div className="rst-actions">{selected.actions.includes("edit") && button("edit", () => void run(() => open("profile")))}{(["publish", "unpublish"] as const).filter(action => selected.actions.includes(action)).map(action => <span key={action}>{button(action, () => void run(() => open(action)))}</span>)}</div></article>}
        {tab === "sharing" && (selected.actions.includes("links") ? <RestaurantSharing key={selected.public_ref} establishment={selected.public_ref} binding={binding} locale={locale} onFailure={error}/> : <p>{t("missing")}: {selected.missing_publication_fields.map(t).join(", ") || t(selected.status)}</p>)}
        {tab === "preview" && <article className="rst-card"><h2>{t("preview")}</h2><p>{t("previewNote")}</p>{preview && details(preview, ["name", "type_label", "description", "location", "opening_status", "opening_information", "service_modes"])}<PrivateMenuPreview key={`${path}:${binding}:${locale}`} path={path} binding={binding} locale={locale} onFailure={workFailure}/></article>}
        {["hours", "offerings"].includes(tab) && <p>{t("refreshed")}</p>}
        {tab === "hours" && hours && <article className="rst-card"><h2>{t("hours")}</h2><p>{t(hours.status)} · {hours.timezone_name}</p>{hours.schedule ? hours.schedule.windows.length ? hours.schedule.windows.map((w, i) => <p key={i}>{t(weekdays[w.weekday])}: {w.start}–{w.end}</p>) : <p>{t("closed")}</p> : <p>{t("unknown")}</p>}{hours.exceptional_closures.map((c, i) => <p key={i}>{t("closures")}: {localInstant(c.starts_at, c.timezone_name ?? null)} — {localInstant(c.ends_at, c.timezone_name ?? null)}</p>)}{button("edit", () => void run(() => open("hours")))}</article>}
{tab === 'items' && <RestaurantPersonalMenu items={rows} routes={routingPage} bindings={stockBindings} offerings={datedOfferings} publicAvailability={publicAvailability} publicCheck={selected.status==='active'} locale={locale} fresh={menuFresh} loadFailed={menuLoadError} busy={busy} stockEnabled={capabilities.includes('restaurant.inventory')} onRefresh={()=>void run(()=>loadTab('items'))} onEdit={row=>void run(()=>open('items',row))} onPhoto={row=>{if(!leaveWork())return;setPhotoTarget({target:'item',itemRef:row.public_ref});setTab('photos');}} onAdd={()=>void run(()=>open('items'))} onCategories={()=>void run(()=>loadTab('categories'))} onBatch={()=>void run(()=>loadTab('batch'))} onStock={()=>void run(()=>loadTab('inventory'))} onOfferings={()=>void run(()=>loadTab('offerings'))}/>}
{["categories", "offerings"].includes(tab) && <>{tab === "offerings" && <div className="rst-menu-heading"><h2>{design.daily}</h2><button type="button" className="rst-text-button" disabled={busy} onClick={() => void run(() => open("offerings"))}>+ {design.add}</button></div>}<div className="rst-menu-rows">{rows.map(row => <article className="rst-menu-row" key={row.public_ref}><div className="rst-item-identity">{tab === 'items' && <div className="rst-photo-thumb"><span>{management.noPhoto}</span><RestaurantPhoto src={typeof row.image_url === 'string' ? row.image_url : null} alt={row.name || ''} sizes="64px"/></div>}<div><h2>{row.name ?? row.item?.name}</h2>{tab === "items" && <p>{row.pricing_model === "UNIT_PRICED" ? `${design.unit} · ${display(row.sale_unit_label)}` : row.pricing_model === "AMOUNT_PRICED" ? design.amount : design.unknown}</p>}</div></div>{tab === "items" ? <><p className="rst-price">{row.pricing_model === "UNIT_PRICED" ? `${display(row.unit_price)} ${display(row.currency)} / ${display(row.sale_unit_label)}` : row.pricing_model === "AMOUNT_PRICED" ? row.amount_mode === "flexible" ? `${basicText(locale,"flexibleFrom")} ${display(row.minimum_amount)} ${display(row.currency)}` : `${display(row.allowed_amounts)} ${display(row.currency)}` : design.unknown}</p><div><p className={`rst-availability rst-state-${row.availability}`}>{t(String(row.availability ?? "unknown"))}</p>{row.visible === false && <p>{t("hidden")}</p>}</div></> : details(row, tab === "categories" ? ["visible"] : ["state", "visible", "availability"])}{tab === "offerings" && <p>{localInstant(row.starts_at, String(row.timezone_name))} — {localInstant(row.ends_at, String(row.timezone_name))}</p>}{tab === 'items' && <RestaurantItemRouting key={row.public_ref} path={path} binding={binding} locale={locale} itemRef={row.public_ref} page={rowPage} route={routingPage?.items?.find(item=>item.item_ref===row.public_ref)?.station} revision={routingPage?.revision ?? null} onSaved={()=>loadTab('items',rowPage)}/>}<div className="rst-actions">{button("edit", () => void run(() => open(tab as Kind, row)))}{tab === 'items' && <button type="button" disabled={busy} onClick={() => { if(!leaveWork())return; setPhotoTarget({target:'item',itemRef:row.public_ref}); setTab('photos'); }}>{management.photo}</button>}{tab === "offerings" && button("copy", () => void run(() => open("copy", row)))}</div></article>)}</div>{!rows.length && <p className="rst-empty">{t("empty")}</p>}<div className="rst-actions rst-pagination">{button("previous", () => void run(() => loadTab(tab, rowPage - 1)), rowPage <= 1)}<span>{design.page} {rowPage}</span>{button("next", () => void run(() => loadTab(tab, rowPage + 1)), rowPage * 20 >= rowTotal)}</div></>}
      </>}
    </>}
    </div></div>
  </section>;
}
