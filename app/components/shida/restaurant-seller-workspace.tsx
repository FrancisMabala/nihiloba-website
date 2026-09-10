"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { DashboardApiError } from "@/app/lib/restaurant-seller-browser";
import type { RestaurantLocale } from "@/app/services/shida/restaurants-client";
import { RestaurantSharing } from "./restaurant-seller-sharing";
import { restaurantText } from "@/app/lib/restaurant-seller-copy";
import { localInstant, performRestaurant as perform, pricing, readRestaurant as read, rootPath, type Closure, type Envelope, type Establishment, type Fields, type Hours, type Kind, type Operation, type Page, type Row, type Window } from "@/app/lib/restaurant-seller";
import "./restaurant-seller.css";

const profileKeys = ["name", "description", "food_business_type", "city", "commune", "quartier", "public_address", "landmark", "address_visibility", "timezone_name", "opening_information", "service_modes", "logo_url", "logo_secure_url"];
const itemKeys = ["name", "description", "image_url", "category_ref", "presentation", "pricing_model", "currency", "sale_unit_label", "unit_price", "allowed_amounts", "minimum_amount", "visible", "availability", "permanent"];
const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
type Editor = { kind: Kind; path: string; method: string; readPath: string; revision: string; operationKey: string; fields: Record<string, string>; changed: string[]; windows: Window[]; closures: Closure[]; target?: string; operation?: Operation; blocked?: boolean; latest?: { revision: string; value: Fields }; };
function strings(value: Fields, keys: string[]) { return Object.fromEntries(keys.map(key => [key, Array.isArray(value[key]) ? (value[key] as string[]).join("; ") : String(value[key] ?? "")])); }
const options: Record<string, string[]> = { food_business_type: ["restaurant", "malewa", "cafe", "fast_food", "catering"], address_visibility: ["broad", "public"], presentation: ["fixed_dish", "component"], pricing_model: ["UNKNOWN", "UNIT_PRICED", "AMOUNT_PRICED"], currency: ["CDF", "USD"], availability: ["available", "sold_out", "temporarily_unavailable"] };
const boolKeys = ["visible", "permanent", "confirm", "confirm_location", "known"];

export function RestaurantWorkspace({ binding, locale }: { binding: string; locale: RestaurantLocale }) {
  const t = (key: string) => restaurantText(locale, key);
  const readRestaurant = <T,>(path: string, language: string) => read<T>(path, language, binding);
  const performRestaurant = <T,>(operation: Operation) => perform<T>(operation, binding);
  const root = rootPath();
  const [list, setList] = useState<Page<Establishment> | null>(null), [page, setPage] = useState(1), [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Establishment | null>(null), [tab, setTab] = useState("profile");
  const [rows, setRows] = useState<Row[]>([]), [rowPage, setRowPage] = useState(1), [rowTotal, setRowTotal] = useState(0);
  const [hours, setHours] = useState<Hours | null>(null), [preview, setPreview] = useState<Fields | null>(null);
  const [choices, setChoices] = useState<Row[]>([]), [editor, setEditor] = useState<Editor | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [denied, setDenied] = useState(false);
  const alive = useRef(true), gate = useRef(false);
  const path = selected ? `${root}/${encodeURIComponent(selected.public_ref)}` : root;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { if (!editor) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [editor]);

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
  async function run(work: () => Promise<void>, mutation = false) {
    if (gate.current) return;
    gate.current = true; setBusy(true); setMessage("");
    try { await work(); } catch (caught) { error(caught, mutation); }
    finally { gate.current = false; if (alive.current) setBusy(false); }
  }
  async function loadList(nextPage = page, status = filter) {
    const value = await readRestaurant<Page<Establishment>>(`${root}?page=${nextPage}&page_size=20${status ? `&status=${status}` : ""}`, locale);
    if (alive.current) { setList(value); setPage(nextPage); setFilter(status); }
  }
  useEffect(() => { void run(() => loadList(1, "")); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function select(ref: string) {
    const value = await readRestaurant<Establishment>(`${root}/${encodeURIComponent(ref)}`, locale);
    if (alive.current) { setSelected(value); setTab("profile"); setRows([]); setHours(null); setPreview(null); }
  }
  async function loadTab(next: string, nextPage = 1) {
    if (next === "profile") { await select(selected!.public_ref); return; }
    if (next === "preview") { const value = await readRestaurant<Establishment>(`${path}/preview`, locale); if (alive.current) { setPreview(value.preview ?? {}); setTab(next); } return; }
    if (next === "hours") { const value = await readRestaurant<Envelope<Hours>>(`${path}/hours`, locale); if (alive.current) { setHours(value.result); setTab(next); } return; }
    const value = await readRestaurant<Envelope<Page<Row>>>(`${path}/menu/${next}?page=${nextPage}&page_size=20`, locale);
    if (alive.current) { setRows(value.result.items); setRowTotal(value.result.total); setRowPage(nextPage); setTab(next); }
  }
  async function allChoices(kind: string) {
    const result: Row[] = []; let next = 1;
    for (;;) {
      const data = await readRestaurant<Envelope<Page<Row>>>(`${path}/menu/${kind}?page=${next}&page_size=50`, locale);
      result.push(...data.result.items); if (result.length >= data.result.total || !data.result.items.length) return result; next++;
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
    if (kind === "items") f = { ...f, category_ref: (values.category as Row | undefined)?.public_ref ?? "", presentation: String(values.presentation ?? "fixed_dish"), pricing_model: String(values.pricing_model ?? "UNKNOWN"), currency: String(values.currency ?? currentCurrency ?? "CDF"), visible: String(values.visible ?? true), permanent: String(values.permanent ?? true), availability: String(values.availability ?? "available") };
    if (kind === "categories") f.visible = String(values.visible ?? true);
    if (kind === "offerings" || kind === "copy") f = { ...f, item_ref: (values.item as Row | undefined)?.public_ref ?? "", starts_at: kind === "copy" ? "" : localInstant(values.starts_at, selected?.profile.timezone_name ?? null), ends_at: kind === "copy" ? "" : localInstant(values.ends_at, selected?.profile.timezone_name ?? null), visible: String(values.visible ?? true), availability: String(values.availability ?? "available") };
    if (alive.current) setEditor({ kind, path: editPath, method, readPath, revision, operationKey: crypto.randomUUID(), fields: f, changed: [], windows: structuredClone(windows), closures: structuredClone(closures), target: row?.public_ref });
  }
  function change(key: string, value: string) { setEditor(old => old ? { ...old, fields: { ...old.fields, [key]: value }, changed: [...new Set([...old.changed, key])], operation: undefined } : null); }
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
    if (e.kind === "items" && (e.method === "POST" || e.changed.some(key => ["pricing_model", "currency", "sale_unit_label", "unit_price", "allowed_amounts", "minimum_amount"].includes(key)))) {
      const normalized = pricing(f);
      // A model change deliberately replaces its pricing tuple. An individual
      // amount edit must not round-trip unrelated (possibly redacted) fields.
      if (e.method === "POST" || e.changed.includes("pricing_model")) Object.assign(fields, normalized);
      else for (const key of e.changed) if (key in normalized) fields[key] = normalized[key];
    }
    return fields;
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (gate.current || !editor || editor.blocked) return;
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
      const tuple = old.changed.includes("pricing_model") ? ["currency", "unit_price", "sale_unit_label", "allowed_amounts", "minimum_amount"] : [];
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
    return key && ["status", "state", "availability", "pricing_model", "presentation", "food_business_type", "address_visibility", "opening_status"].includes(key) ? t(String(value)) : String(value);
  }
  function details(value: Fields, keys: string[]) { return <dl className="rst-details">{keys.filter(key => key in value).map(key => <div key={key}><dt>{t(key)}</dt><dd>{display(value[key], key)}</dd></div>)}</dl>; }
  function input(key: string, required = false) {
    if (!editor) return null;
    const value = editor.fields[key] ?? "";
    const choicesForKey = key === "category_ref" || key === "item_ref" ? choices : undefined;
    return <label key={key}>{t(key)}{boolKeys.includes(key) ? <input type="checkbox" checked={value === "true"} required={required} onChange={event => change(key, String(event.target.checked))} /> : choicesForKey ? <select required={required} value={value} onChange={event => change(key, event.target.value)}><option value="">—</option>{choicesForKey.map(row => <option key={row.public_ref} value={row.public_ref}>{row.name}</option>)}</select> : options[key] ? <select required={required} value={value} onChange={event => change(key, event.target.value)}><option value="">—</option>{options[key].map(option => <option key={option} value={option}>{t(option)}</option>)}</select> : ["description", "opening_information", "service_modes"].includes(key) ? <textarea required={required} maxLength={4000} value={value} onChange={event => change(key, event.target.value)} /> : <input required={required} name={key} type={key.includes("url") ? "url" : "text"} inputMode={["unit_price", "minimum_amount"].includes(key) ? "decimal" : "text"} maxLength={key === "name" ? 200 : 2000} value={value} onChange={event => change(key, event.target.value)} />}</label>;
  }
  const button = (label: string, action: () => void, disabled = false) => <button type="button" className="button button-secondary" disabled={busy || disabled} onClick={action}>{t(label)}</button>;
  if (denied) return <section className="rst container section"><p role="alert">{t(message)}</p><Link href={`${locale === "en" ? "" : `/${locale}`}/shida/seller/restaurants`}>{t("review")}</Link></section>;
  return <section className="rst container" aria-label={t("restaurants")}>
    <header className="page-heading"><div><p className="eyebrow">{t("restaurants")}</p><h2>{selected?.profile.name ?? t("establishments")}</h2></div></header>
    <p role={message && message !== "saved" && message !== "unsaved" ? "alert" : "status"} aria-live="polite">{busy ? t(editor?.operation ? "saving" : "loading") : message ? t(message) === "—" ? t("validation") : t(message) : editor ? t("unsaved") : ""}</p>
    {editor ? <form onSubmit={submit} className="rst-card" aria-label={t(editor.kind)}>
      <h2>{t(editor.kind)}</h2>
      <p>{t("editingScope")}</p>
      {editor.kind === "profile" && <><p>{t("locationHelp")}</p><p>{t("timezoneHelp")}</p></>}
      {editor.kind === "items" && <p>{t("moneyHelp")}</p>}
      {["offerings", "copy", "hours"].includes(editor.kind) && <><p>{t("timezone_name")}: {selected?.profile.timezone_name ?? t("unknown")}</p><p>{t("timeHelp")}</p></>}
      {editor.kind === "copy" && <p>{t("copyHelp")}</p>}
      {editor.kind === "offerings" && editor.target && <p>{t("dateConfirmation")}</p>}
      <fieldset disabled={busy || Boolean(editor.operation) || editor.blocked} className="rst-fields">
        {editor.kind === "create" && <>{input("name", true)}{input("food_business_type", true)}{["city", "commune", "quartier"].map(key => input(key))}</>}
        {editor.kind === "profile" && <>{profileKeys.map(key => input(key, ["name", "description", "city", "commune", "quartier"].includes(key) && editor.changed.includes(key)))}{input("confirm_location", editor.changed.some(key => ["public_address", "landmark", "address_visibility"].includes(key)))}</>}
        {editor.kind === "categories" && <>{input("name", true)}{input("visible")}</>}
        {editor.kind === "items" && <>{["name", "category_ref", "presentation", "pricing_model"].map(key => input(key, true))}{input("description")}{input("image_url")}{editor.fields.pricing_model !== "UNKNOWN" && input("currency", true)}{editor.fields.pricing_model === "UNIT_PRICED" && <>{input("sale_unit_label", true)}{input("unit_price", true)}</>}{editor.fields.pricing_model === "AMOUNT_PRICED" && <>{input("allowed_amounts", true)}{input("minimum_amount")}</>}{input("visible")}{input("availability", true)}{input("permanent")}</>}
        {(editor.kind === "offerings" || editor.kind === "copy") && <>{editor.kind === "offerings" && !editor.target && input("item_ref", true)}{input("starts_at", true)}{input("ends_at", true)}{editor.kind === "offerings" && <>{input("visible")}{input("availability", true)}{input("confirm", !editor.target)}</>}</>}
        {editor.kind === "hours" && <div className="rst-wide"><p>{t("hoursHelp")}</p>{input("known")}<h3>{t("windows")}</h3>{editor.fields.known === "true" && <>{editor.windows.map((window, index) => <div className="rst-row" key={index}><label>{t("weekday")}<select value={window.weekday} onChange={event => changeHours({ windows: editor.windows.map((w, i) => i === index ? { ...w, weekday: Number(event.target.value) } : w) })}>{weekdays.map((day, i) => <option key={day} value={i}>{t(day)}</option>)}</select></label>{(["start", "end"] as const).map(key => <label key={key}>{t(key)}<input type="time" required value={window[key]} onChange={event => changeHours({ windows: editor.windows.map((w, i) => i === index ? { ...w, [key]: event.target.value } : w) })} /></label>)}{button("remove", () => changeHours({ windows: editor.windows.filter((_, i) => i !== index) }))}</div>)}{button("addWindow", () => changeHours({ windows: [...editor.windows, { weekday: 0, start: "09:00", end: "17:00" }] }))}</>}<h3>{t("closures")}</h3>{editor.closures.map((closure, index) => <div className="rst-row" key={index}>{closure.confirmed_at ? <p>{localInstant(closure.starts_at, closure.timezone_name ?? null)} — {localInstant(closure.ends_at, closure.timezone_name ?? null)}</p> : (["starts_at", "ends_at"] as const).map(key => <label key={key}>{t(key)}<input required value={closure[key]} onChange={event => changeHours({ closures: editor.closures.map((c, i) => i === index ? { ...c, [key]: event.target.value } : c) })} /></label>)}{button("remove", () => changeHours({ closures: editor.closures.filter((_, i) => i !== index) }))}</div>)}{button("addClosure", () => changeHours({ closures: [...editor.closures, { starts_at: "", ends_at: "" }] }))}{input("confirm", true)}</div>}
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
    </form> : <>
      {!selected ? <><div className="rst-actions"><label>{t("establishments")}<select value={filter} disabled={busy} onChange={event => void run(() => loadList(1, event.target.value))}><option value="">{t("all")}</option>{["draft", "active", "inactive"].map(status => <option key={status} value={status}>{t(status)}</option>)}</select></label>{list?.actions?.includes("create") && button("add", () => void run(() => open("create")))}{button("reload", () => void run(() => loadList()))}</div><div className="rst-grid">{list?.items.map(row => <article className="rst-card" key={row.public_ref}><h2>{row.profile.name}</h2><p>{t(row.status)}</p>{button("edit", () => void run(() => select(row.public_ref)))}</article>)}</div>{list && !list.items.length && <p>{t("empty")}</p>}<div className="rst-actions">{button("previous", () => void run(() => loadList(page - 1)), page <= 1)}{button("next", () => void run(() => loadList(page + 1)), !list || page * 20 >= list.total)}</div></> : <>
        <div className="rst-actions">{button("back", () => { setSelected(null); setPreview(null); void run(() => loadList()); })}{["profile", "categories", "items", "offerings", "hours", "preview"].map(key => <button key={key} type="button" className="button button-secondary" aria-pressed={tab === key} disabled={busy} onClick={() => void run(() => loadTab(key))}>{t(key)}</button>)}</div>
        {tab === "profile" && <article className="rst-card"><p>{t(selected.status)}</p>{details(selected.profile, profileKeys)}<p>{t("location_confirmed")}: {t(selected.location_confirmed ? "yes" : "no")}</p>{selected.missing_publication_fields.length > 0 && <p>{t("missing")}: {selected.missing_publication_fields.map(t).join(", ")}</p>}<div className="rst-actions">{selected.actions.includes("edit") && button("edit", () => void run(() => open("profile")))}{(["publish", "unpublish"] as const).filter(action => selected.actions.includes(action)).map(action => <span key={action}>{button(action, () => void run(() => open(action)))}</span>)}</div></article>}
        {tab === "profile" && selected.actions.includes("links") && <RestaurantSharing key={selected.public_ref} establishment={selected.public_ref} binding={binding} locale={locale} onFailure={error}/>}
        {tab === "preview" && <article className="rst-card"><h2>{t("preview")}</h2><p>{t("previewNote")}</p>{preview && details(preview, ["name", "type_label", "description", "location", "opening_status", "opening_information", "service_modes"])}</article>}
        {["hours", "items", "offerings"].includes(tab) && <p>{t("refreshed")}</p>}
        {tab === "hours" && hours && <article className="rst-card"><h2>{t("hours")}</h2><p>{t(hours.status)} · {hours.timezone_name}</p>{hours.schedule ? hours.schedule.windows.length ? hours.schedule.windows.map((w, i) => <p key={i}>{t(weekdays[w.weekday])}: {w.start}–{w.end}</p>) : <p>{t("closed")}</p> : <p>{t("unknown")}</p>}{hours.exceptional_closures.map((c, i) => <p key={i}>{t("closures")}: {localInstant(c.starts_at, c.timezone_name ?? null)} — {localInstant(c.ends_at, c.timezone_name ?? null)}</p>)}{button("edit", () => void run(() => open("hours")))}</article>}
        {["categories", "items", "offerings"].includes(tab) && <>{button("add", () => void run(() => open(tab as Kind)))}<div className="rst-grid">{rows.map(row => <article className="rst-card" key={row.public_ref}><h2>{row.name ?? row.item?.name}</h2>{details(row, tab === "categories" ? ["visible"] : tab === "items" ? itemKeys.filter(k => k !== "category_ref") : ["state", "visible", "availability"])}{tab === "offerings" && <p>{localInstant(row.starts_at, String(row.timezone_name))} — {localInstant(row.ends_at, String(row.timezone_name))}</p>}<div className="rst-actions">{button("edit", () => void run(() => open(tab as Kind, row)))}{tab === "offerings" && button("copy", () => void run(() => open("copy", row)))}</div></article>)}</div>{!rows.length && <p>{t("empty")}</p>}<div className="rst-actions">{button("previous", () => void run(() => loadTab(tab, rowPage - 1)), rowPage <= 1)}{button("next", () => void run(() => loadTab(tab, rowPage + 1)), rowPage * 20 >= rowTotal)}</div></>}
      </>}
    </>}
  </section>;
}
