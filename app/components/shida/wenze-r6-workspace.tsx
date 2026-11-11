"use client";
import {wenzeActionConfirmation} from "@/app/lib/wenze-action-confirmation";
import bulkCopy from "@/app/lib/wenze-bulk-copy.json";
import {ShopIcon} from "./wenze-shop-icons";
import "./wenze-import-design.css";
import {WenzeOrderUpdates} from "./wenze-order-updates";
import {progressText} from "./wenze-order-timeline";
import {type Receipt} from "./wenze-pos";
import {WenzeOrdersView,type SellerOrder} from "./wenze-orders-view";
import {posText} from "@/app/lib/wenze-pos-copy";
import {useWenzeConfirm} from "./wenze-confirm";
import { useWorkDraft, leaveWork } from "@/app/lib/wenze-work";
import { sellerText } from "@/app/lib/wenze-seller-copy";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useWenzeApi, DashboardApiError } from "@/app/lib/wenze-seller-api";
import { r6Text } from "@/app/lib/wenze-r6-copy";
import { wenzeCopy, type WenzeLocale, type WenzeKey } from "@/app/lib/wenze-copy";

type Shop = { public_ref: string; name: string };
type Order = SellerOrder;
type Photo = { photo_ref: string; image_url: string | null; verified: boolean };
type Variant = { label: string; stock_quantity: number | null };
type Payload = { name: string; price: string; currency: string; category: string; condition: string; description: string; negotiable: boolean; stock: number | null; variant_type: string | null; variants: Variant[]; photos: Photo[] };
type ImportItem = { source_rows?:number[]; item_ref: string; review_version: number; review_state: string; payload: Payload; errors: { code: string }[]; warnings: { code: string }[]; duplicate_candidates: { product_ref: string; name: string; price: string; currency: string; variants: string[] }[]; published_product_ref: string | null };
type Run = { run_ref: string; run_version: number; total: number; remaining: number; outcomes: { item_ref: string; outcome: string; product_ref?: string }[] };
type Job = { import_ref: string; review_version: number; store_ref: string; store_name: string; original_filename: string; status: string; column_mapping: Record<string, string>; source_columns: { name: string; display_name: string; samples: string[] }[]; summary: Record<string, number>; items: ImportItem[]; publication_runs: Run[] };
type Selection = { item_ref: string; review_version: number };
const enc = encodeURIComponent;

const bytes = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(file); });

export function WenzeR6Workspace({ context, locale, initialView, initialStore, initialOrder, ordersOnly=false, orderingUnavailable=false, noOrderHistory=false, onCheckout, onShop, onCreate, onProducts }: { onCreate?:()=>void; onProducts?:()=>void; orderingUnavailable?:boolean; noOrderHistory?:boolean; onCheckout?:()=>void; onShop?:()=>void; initialOrder?:string; ordersOnly?:boolean; context: string; locale: WenzeLocale; initialView:string; initialStore?:string }) {
 const bulk=bulkCopy[locale];
 const fileInput=useRef<HTMLInputElement>(null);
 const photoInput=useRef<HTMLInputElement>(null);
 const [fileName,setFileName]=useState("");
 const [clarify,setClarify]=useState(false);
 const [distinct,setDistinct]=useState<Record<string,number>>({});
 const {confirm,confirmation}=useWenzeConfirm(locale);
 const {request,download}=useWenzeApi();
 const [receipt,setReceipt]=useState<Receipt|null>(null);
 const send = (path: string, data: unknown, method = "POST") => request(path, { method, body: JSON.stringify(data) });
 useEffect(()=>{void open(initialView);},[initialView]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = (key: string) => key === "preparing" ? progressText(locale,key) : r6Text(locale, key);
  const base = `wenze/contexts/${enc(context)}`;
  const [view, setView] = useState(""), [shops, setShops] = useState<Shop[]>([]), [shop, setShop] = useState(initialStore??"");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [stale, setStale] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]), [counts, setCounts] = useState<Record<string, number>>({}), [order, setOrder] = useState<Order | null>(null);
  const [bucket, setBucket] = useState("all"), [search, setSearch] = useState(""), [offset, setOffset] = useState(0), [total, setTotal] = useState(0), [action, setAction] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<Job[]>([]), [job, setJob] = useState<Job | null>(null), [item, setItem] = useState<ImportItem | null>(null), [draft, setDraft] = useState<Payload | null>(null);
  const [options, setOptions] = useState<{categories: {code: string; label: string}[]; currencies: string[]; issues: Record<string, string>; support_url: string | null}>({categories: [], currencies: ["CDF", "USD"], issues: {}, support_url: null});
  const [mapping, setMapping] = useState<Record<string, string>>({}), [itemFilter, setItemFilter] = useState("all"), [selection, setSelection] = useState<Selection[]>([]), [review, setReview] = useState<{ mode: string; items: Selection[]; version: number } | null>(null), [publication, setPublication] = useState<Run | null>(null);
  useWorkDraft(!!draft && JSON.stringify(draft)!==JSON.stringify(item?.payload)||Object.keys(fields).length>0||!!job&&JSON.stringify(mapping)!==JSON.stringify(job.column_mapping),sellerText(locale,"leave"));
  const alive = useRef(true),orderLock=useRef(false);
  const [appliedSearch,setAppliedSearch]=useState("");
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const jobPath = `${base}/catalog-imports/${enc(job?.import_ref ?? "")}`;
  const itemPath = `${jobPath}/items/${enc(item?.item_ref ?? "")}`;
  async function guarded(work: () => Promise<void>) {
    if(orderLock.current)return;orderLock.current=true;
    setBusy(true); setError("");
    try { await work(); }
    catch (caught) {
      if (!alive.current) return;
      if (caught instanceof DashboardApiError && caught.kind === "conflict") {
        setError("conflict"); setStale(true); setReview(null); setSelection([]);
        try {
          if (order) setOrder(await request(`${base}/orders/${enc(order.reference)}?language=${locale}`) as Order);
          if (job) { const latest = await request(jobPath) as Job; setJob(latest); if(latest.publication_runs.length)setPublication(latest.publication_runs[0]); if (item) setItem(await request(itemPath) as ImportItem); if (publication) setPublication(await request(`${jobPath}/publication-runs/${enc(publication.run_ref)}`) as Run); }
        } catch { clearPrivate(); setError("unavailable"); }
      } else if (caught instanceof DashboardApiError && [401, 403, 404].includes(caught.status)) { clearPrivate(); setError("unavailable"); }
      else setError("error");
    } finally { orderLock.current=false;if (alive.current) setBusy(false); }
  }
  function clearPrivate() { setOrders([]); setJobs([]); setReceipt(null); setOrder(null); setJob(null); setItem(null); setDraft(null); setReview(null); setSelection([]); setPublication(null); setFields({}); setMapping({}); setShops([]); }
  async function loadOrders(page = offset, group = bucket, store = shop, needle=search) {
    const data = await request(`${base}/orders?language=${locale}&bucket=${enc(group)}&store_ref=${enc(store)}&search=${enc(needle)}&offset=${page}&limit=20`) as { orders: Order[]; counts: Record<string, number>; total: number };
    if (!alive.current) return;
    setAppliedSearch(needle);setOrders(data.orders); setCounts(data.counts); setTotal(data.total); setOffset(page);
  }
  async function loadJobs(page = 0, store = shop) {
    const data = await request(`${base}/catalog-imports?store_ref=${enc(store)}&offset=${page}&limit=20`) as { jobs: Job[]; total: number };
    if (!alive.current) return;
    setJobs(data.jobs); setTotal(data.total); setOffset(page);
  }
  async function open(which: string) {
    setView(which); setReceipt(null); setOrder(null); setJob(null); setItem(null); setPublication(null); setReview(null); setFields({}); setStale(false); setOffset(0);
    await guarded(async () => {
      const data = await request(`${base}/catalog-imports/options?language=${locale}`) as typeof options & { stores: Shop[] };
      if (!alive.current) return;
      setShops(data.stores); setOptions({ ...data, currencies: data.currencies?.length ? data.currencies : ["CDF", "USD"] });
      if (which === "orders") {
        await loadOrders(0);
        if(initialOrder){
          const selected=await request(`${base}/orders/${enc(initialOrder)}?language=${locale}`) as Order;
          if(alive.current&&selected.shop_reference===initialStore)setOrder(selected);
        }
      } else await loadJobs();
    });
  }
  async function openJob(ref: string, uploaded=false) { const data = await request(`${base}/catalog-imports/${enc(ref)}`) as Job; if (!alive.current) return; setJob(data); setMapping(data.column_mapping);
    setClarify(data.status==="mapping_required" || (uploaded && data.source_columns.some(col=>!Object.values(data.column_mapping).includes(col.name)&&col.samples.length>0)));
    setFileName(data.original_filename); setItem(null); setDraft(null); setSelection([]); setReview(null); setPublication(data.publication_runs[0] ?? null); setStale(false); }
  async function openItem(row: ImportItem) { const current = await request(`${jobPath}/items/${enc(row.item_ref)}`) as ImportItem; if (!alive.current) return; setItem(current); setDraft(structuredClone(current.payload)); setStale(false); }
  async function itemChange(suffix: string, data: object, method = "POST") {
    const result = await send(itemPath + suffix, { ...data, expected_review_version: item!.review_version }, method) as ImportItem;
    if (!alive.current) return;
    setItem(result); setDraft(old => suffix && old ? {...old, photos: structuredClone(result.payload.photos)} : structuredClone(result.payload)); setReview(null); setSelection([]); setJob(await request(jobPath) as Job);
  }
  function field(key: string, options?: string[]) { return <label key={key}>{t(key === "timeframe" ? "delivery_timeframe" : key)}{options ? <select value={fields[key] ?? ""} required onChange={e => setFields({ ...fields, [key]: e.target.value })}><option value="">—</option>{options.map(value => <option key={value} value={value}>{t(value)}</option>)}</select> : <input type={key === "pickup_token" ? "password" : "text"} autoComplete="off" value={fields[key] ?? ""} required onChange={e => setFields({ ...fields, [key]: e.target.value })} />}</label>; }
  const button = (key: string, work: () => Promise<void> | void) => <button disabled={busy || stale} type="button" onClick={() => void guarded(async () => { await work(); })}>{t(key)}</button>;
  const pages = <div className="wz-actions">{offset > 0 && button("previous", () => view === "orders" ? loadOrders(offset - 20) : loadJobs(offset - 20))}{offset + 20 < total && button("next", () => view === "orders" ? loadOrders(offset + 20) : loadJobs(offset + 20))}</div>;
  const reviewAgain = stale && <label><input type="checkbox" onChange={e => setStale(!e.target.checked)} />{t("reviewed")}</label>;
  async function uploadImport(file?: File) { if (!file || !shop) return; setFileName(file.name); if(file.size>10*1024*1024){setError("oversize");return;} const result = await send(`${base}/catalog-imports`, { store_ref: shop, filename: file.name, content_base64: await bytes(file) }) as Job; await openJob(result.import_ref,true); }
  async function uploadPhotos(files: FileList | null) {
    if (!files || !item) return;
    let current = item;
    for (const file of Array.from(files)) {
      if(file.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))throw new DashboardApiError("validation",422);
      const upload = await send(itemPath + "/uploads", { content_base64: await bytes(file) }) as { upload_ref: string };
      current = await send(itemPath + "/photos", { ...upload, expected_review_version: current.review_version }) as ImportItem;
      if (!alive.current) return;
      setItem(current); setDraft(old=>old?{...old,photos:structuredClone(current.payload.photos)}:structuredClone(current.payload));
    }
    setReview(null); setSelection([]); setJob(await request(jobPath) as Job);
  }
  async function saveItem(e: FormEvent) { e.preventDefault(); if (stale || !draft) return; const fields = Object.fromEntries(Object.entries(draft).filter(([key, value]) => ["name", "price", "currency", "category", "condition", "description", "negotiable", "stock", "variant_type", "variants"].includes(key) && JSON.stringify(value) !== JSON.stringify(item?.payload[key as keyof Payload]))); await guarded(() => itemChange("", { fields }, "PATCH")); }
  const choose = (row: ImportItem, checked: boolean) => { setReview(null); setSelection(old => checked ? [...old.filter(v => v.item_ref !== row.item_ref), { item_ref: row.item_ref, review_version: row.review_version }] : old.filter(v => v.item_ref !== row.item_ref)); };
  const filtered = job?.items.filter(row => itemFilter === "all" || row.review_state === (itemFilter === "possible_duplicates" ? "possible_duplicate" : itemFilter)) ?? [];
  const draftRows=job?.items.filter(row=>!row.published_product_ref && row.review_state!=="skipped")??[];
  const sameName=(row:ImportItem)=>draftRows.filter(peer=>peer.item_ref!==row.item_ref && peer.payload.name.trim().toLocaleLowerCase(locale)===row.payload.name.trim().toLocaleLowerCase(locale));
  const eligible=(row:ImportItem)=>row.review_state==="ready" && (!sameName(row).length||distinct[row.item_ref]===row.review_version);
  const readyRows=draftRows.filter(eligible);
  const fileControl=<input type="file" hidden ref={fileInput} disabled={busy||!shop} accept=".csv,.xlsx" onChange={e=>{const file=e.target.files?.[0];e.target.value="";void guarded(()=>uploadImport(file));}}/>;
  const fieldKeys=["name","price","currency","category","condition","description","negotiable","stock","variant_type","variant_label","variant_stock","product_key","image_url"];
  const editColumn=(col:string,key:string)=>setMapping(old=>{
    const next=Object.fromEntries(Object.entries(old).filter(([,value])=>value!==col));
    if(key)next[key]=col;
    return next;
  });
  return <section className={`wz-r6 ${view==="imports"?"wp-import":""}`}>{confirmation}{!ordersOnly&&!initialStore&&<nav className="wz-actions">{button("orders", () => open("orders"))}{button("imports", () => open("imports"))}</nav>}
    {view && <>{view!=="orders"&&<>{!initialStore&&<h2>{t(view)}</h2>}{busy && <p role="status">{t("loading")}</p>}{error && <p role="alert">{error==="oversize"?bulk.oversize:t(error)}</p>}</>}
    <label hidden={ordersOnly||!!initialStore}>{t("allStores")}<select disabled={busy} value={shop} onChange={async e => { const value = e.target.value; if(!await leaveWork())return; setDraft(null);setMapping({}); setShop(value); setReceipt(null); setOrder(null); setJob(null); setItem(null); setReview(null); setPublication(null); void guarded(() => view === "orders" ? loadOrders(0, bucket, value) : loadJobs(0, value)); }}><option value="">{t("allStores")}</option>{shops.map(row => <option key={row.public_ref} value={row.public_ref}>{row.name}</option>)}</select></label>
    {view === "orders" && <WenzeOrdersView orderingUnavailable={orderingUnavailable} noOrderHistory={noOrderHistory} onCheckout={onCheckout} onShop={onShop} locale={locale} orders={orders} order={order} counts={counts} bucket={bucket} search={search} searched={appliedSearch} busy={busy} error={error} action={action} receipt={receipt} pages={pages}
      onSearchChange={setSearch} onSearch={()=>void guarded(()=>loadOrders(0))}
      onClear={()=>{setSearch("");void guarded(()=>loadOrders(0,bucket,shop,""));}}
      onFilter={key=>{setBucket(key);void guarded(()=>loadOrders(0,key));}}
      onRetry={()=>void guarded(()=>loadOrders())}
      onOpen={row=>void guarded(async()=>{const selected=await request(`${base}/orders/${enc(row.reference)}?language=${locale}`) as Order;if(shop&&selected.shop_reference!==shop)throw new DashboardApiError('unavailable',404);if(alive.current){setOrder(selected);setAction("");setFields({});setStale(false);}})}
      onBack={()=>void guarded(async()=>{setReceipt(null);setOrder(null);setAction("");setFields({});setStale(false);await loadOrders();})}
      onAction={key=>{setAction(key);setFields({});}} onCancelAction={()=>{setAction("");setFields({});}}
      onReceipt={()=>{if(order)void guarded(async()=>setReceipt(await send(`${base}/orders/${enc(order.reference)}/receipt`,{}) as Receipt));}} onCloseReceipt={()=>setReceipt(null)}
      updates={order&&<WenzeOrderUpdates key={`${base}:${order.reference}`} locale={locale} identity={`${base}:${order.reference}`} load={()=>request(`${base}/orders/${enc(order.reference)}/updates`)} read={()=>send(`${base}/orders/${enc(order.reference)}/updates/read`,{})}/>}
      actionForm={order&&<form onSubmit={e=>{e.preventDefault();if(stale||!order.allowed_actions.includes(action))return;void guarded(async()=>{const result=await send(`${base}/orders/${enc(order.reference)}/actions?language=${locale}`,{action,action_revision:order.action_revision,...fields}) as Order;if(alive.current){setOrder(result);setAction("");setFields({});}});}}>{action==="counter"&&field("counter_price")}{action==="cancelled"&&field("reason")}{action==="verify_handoff"&&field("pickup_token")}{action==="delivery_timeframe"&&field("timeframe",["today","tomorrow","2_3_days","custom"])}{fields.timeframe==="custom"&&field("timeframe_detail")}{reviewAgain}<button disabled={busy||stale||!order.allowed_actions.includes(action)}>{t("confirm")} · {t(action==="cancelled"?"cancelOrder":action)}</button></form>}
    />}
    {view === "imports" && <><ol className="wz-import-steps">{[bulk.file,bulk.review,bulk.publish].map((label,i)=><li key={label} aria-current={(!job?0:review||publication?2:1)===i?"step":undefined}><b>{i+1}</b>{label}</li>)}</ol>
    {!job ? <><p>{bulk.intro}</p><section className="wc-card wp-import-upload wb-upload"><span className="wb-icon"><ShopIcon name="upload"/></span><div><h2>{bulk.have}</h2>
      {fileControl}<button className="seller-primary" disabled={busy||!shop} onClick={()=>fileInput.current?.click()}>{fileName?bulk.change:bulk.choose}</button>
      {fileName&&<p>{fileName}</p>}<small>{bulk.limit}</small><p>✓ {bulk.safe}</p></div></section>
    <section className="wc-card wb-template"><div><h2>{bulk.need}</h2><p>{bulk.fill}</p><button disabled={busy} onClick={()=>void guarded(()=>download(`${base}/catalog-imports/template?language=${locale}`))}>{bulk.download}</button></div>
    <table><caption>{bulk.example}</caption><thead><tr>{[bulk.product,bulk.price,bulk.quantity].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{[[bulk.soap,2500,12],[bulk.cable,5000,8]].map(([name,price,qty])=><tr key={name}><td>{name}</td><td>{Number(price).toLocaleString(locale)} CDF</td><td>{qty}</td></tr>)}</tbody></table></section>
    {onCreate&&<button className="wi-link" onClick={onCreate}>{bulk.one} →</button>}{!!jobs.length && <h3>{posText(locale,"importHistory")}</h3>}<div className="wz-grid">{jobs.map(row => <button disabled={busy} key={row.import_ref} onClick={() => void guarded(() => openJob(row.import_ref))}>{row.store_name} · {row.original_filename}<span>{t("published")}: {row.summary.published}</span></button>)}</div>{pages}</> : <article>{button("back", async () => { if(!await leaveWork())return; if(review){setReview(null);return;} if (item) { setItem(null); setDraft(null); setJob(await request(jobPath) as Job); } else { setJob(null); setReview(null); setPublication(null); await loadJobs(); } })}<h3>{job.original_filename}</h3>{!publication&&<>{fileControl}<button disabled={busy} onClick={()=>fileInput.current?.click()}>{bulk.change}</button><p>{bulk.safe}</p></>}
    {!item ? <>{clarify&&!review&&!publication&&<form className="wc-card wb-mapping" onSubmit={e=>{e.preventDefault();void guarded(async()=>{
      if(JSON.stringify(mapping)!==JSON.stringify(job.column_mapping)){
        const updated=await send(jobPath+"/mapping",{column_mapping:mapping,expected_job_version:job.review_version},"PUT") as Job;
        setJob(updated);setMapping(updated.column_mapping);setSelection([]);setReview(null);
      }
      setClarify(false);
    });}}>
    {job.source_columns.filter(col=>!Object.values(job.column_mapping).includes(col.name)||job.status==="mapping_required").map(col=><label key={col.name}>{bulk.column.replace("{v}",col.display_name)} <small>{col.samples.join(" · ")}</small>
      <select value={Object.keys(mapping).find(k=>mapping[k]===col.name)??""} onChange={e=>editColumn(col.name,e.target.value)}><option value="">{bulk.skip}</option>{fieldKeys.map(k=><option key={k} value={k}>{k==="stock"?bulk.stock:k==="image_url"?t("photos"):t(k)}</option>)}</select></label>)}
    {!job.column_mapping.currency&&<label>{t("currency")}<select value={mapping.currency??""} onChange={e=>setMapping({...mapping,currency:e.target.value})}><option value="">—</option>{job.source_columns.map(col=><option value={col.name} key={col.name}>{col.display_name}</option>)}{options.currencies.map(code=><option key={code} value={"__constant__:"+code}>{code}</option>)}</select></label>}
    {reviewAgain}<button disabled={busy||stale||!mapping.name||!mapping.price||!mapping.currency}>{bulk.review}</button></form>}
    {!clarify&&!review&&!publication&&<> <h3>{bulk.ready.replace("{n}",String(readyRows.length)).replace("{v}",String(draftRows.length-readyRows.length))}</h3>
    {!["published", "cancelled"].includes(job.status) && button("validate", async () => { setJob(await send(jobPath + "/validate", { expected_job_version: job.review_version }) as Job); setReview(null); setSelection([]); })}<button type="button" onClick={()=>void guarded(()=>download(`${jobPath}/errors.csv`))}>{t("errors")}</button><nav className="wz-actions">{["all", "ready", "need_correction", "need_photos", "possible_duplicates", "skipped", "published"].map(key => <button key={key} onClick={() => setItemFilter(key)}>{t(key)} {job.summary[key] ?? ""}</button>)}</nav>
    <div className="wz-grid">{filtered.map(row => <article className="wz-card" key={row.item_ref}>{eligible(row) && <label><input type="checkbox" checked={selection.some(v => v.item_ref === row.item_ref)} onChange={e => choose(row, e.target.checked)} />{t("selected")}</label>}<button disabled={busy || job.status === "cancelled"} onClick={() => void guarded(() => openItem(row))}>{row.payload.name || "#"+(row.source_rows??[]).join(", ")} · {t(row.review_state === "possible_duplicate" ? "possible_duplicates" : row.review_state)}</button><p>{[row.payload.price&&row.payload.price+" "+row.payload.currency,bulk.stock+" · "+(row.payload.variants?.length?row.payload.variants.every(v=>v.stock_quantity!==null)?row.payload.variants.reduce((sum,v)=>sum+v.stock_quantity!,0):"—":row.payload.stock??"—")].filter(Boolean).join(" · ")}</p>
      {row.payload.variants?.map(v=><p key={v.label}>{v.label} · {v.stock_quantity??"—"}</p>)}
      {row.errors?.map((issue,i)=><p key={i}>{row.payload.name} — {options.issues[issue.code]??t("need_correction")}</p>)}
      {sameName(row).length>0&&<label>{bulk.fileDup} · {sameName(row).map(peer=>[peer.payload.name,peer.payload.price,peer.payload.currency,...peer.payload.variants.map(v=>v.label)].join(" ")).join(" · ")}
        <input type="checkbox" checked={distinct[row.item_ref]===row.review_version} onChange={e=>{setDistinct({...distinct,[row.item_ref]:e.target.checked?row.review_version:-1});setSelection([]);}}/>{bulk.distinct}</label>}
      {row.published_product_ref && <a href={`${locale==="en"?"":"/"+locale}/shida/seller/wenze?context=${enc(context)}&store=${enc(job.store_ref)}&product=${enc(row.published_product_ref)}`}>{t("published")}</a>}</article>)}</div>
    {!["published", "cancelled"].includes(job.status) && <><div className="wz-actions">{readyRows.length>0&&button("ready_snapshot", () => { setReview({ mode: "selected", items: readyRows.map(row => ({ item_ref: row.item_ref, review_version: row.review_version })), version: job.review_version }); })}{selection.length > 0 && button("review", () => setReview({ mode: "selected", items: [...selection], version: job.review_version }))}</div></>}</>}{review && review.items.length > 0 && <section className="wc-card"><h2>{job.store_name}</h2><p>{bulk.excluded.replace("{n}",String(job.items.length-review.items.length))}</p><button onClick={()=>setReview(null)}>{t("back")}</button>{review.items.map(row => <p key={row.item_ref}>{job.items.find(v => v.item_ref === row.item_ref)?.payload.name}</p>)}{<button className="seller-primary" disabled={busy||stale} onClick={()=>void guarded(async () => { const result = await send(jobPath + "/publish", { expected_job_version: review.version, selection_mode: review.mode, selection: review.items }) as Run; setPublication(result); setReview(null); setSelection([]); setJob(await request(jobPath) as Job); })}>{bulk.confirm.replace("{n}",String(review.items.length)).replace("(s)",review.items.length===1?"":"s")}</button>}</section>}
    </> : <><h4>{item.payload.name} · {t(item.review_state === "possible_duplicate" ? "possible_duplicates" : item.review_state)}</h4>{item.errors.map((issue, i) => <p role="alert" key={i}>{options.issues[issue.code] ?? t("need_correction")}</p>)}
    {stale && <aside><h4>{wenzeCopy[locale].current}</h4><p>{item.payload.name} {item.payload.price} {item.payload.currency}</p><p>{item.payload.description}</p></aside>}{draft && !item.published_product_ref && <><form onSubmit={saveItem}><div className="wz-fields">{["name", "price", "currency", "category", "condition", "description", "variant_type"].map(key => <label key={key}>{t(key)}{["currency", "category", "condition", "variant_type"].includes(key) ? <select value={String(draft[key as keyof Payload] ?? "")} onChange={e => setDraft({ ...draft, [key]: e.target.value })}><option value="">&#8212;</option>{(key === "category" ? options.categories : (key === "currency" ? options.currencies : key === "condition" ? ["new", "like_new", "used", "other", "unspecified"] : ["size", "shoe_size", "storage", "volume", "option"]).map(code => ({code, label: key === "currency" ? code : wenzeCopy[locale][code as WenzeKey]}))).map(row => <option key={row.code} value={row.code}>{row.label}</option>)}</select> : <input value={String(draft[key as keyof Payload] ?? "")} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />}</label>)}<label>{t("negotiable")}<input type="checkbox" checked={draft.negotiable} onChange={e => setDraft({ ...draft, negotiable: e.target.checked })} /></label><label>{t("stock")}<input type="number" min="0" step="1" value={draft.stock ?? ""} onChange={e => setDraft({ ...draft, stock: e.target.value === "" ? null : Number(e.target.value) })} /></label></div><h4>{t("variants")}</h4>{draft.variants?.map((variant, i) => <div className="wz-inline" key={i}><label>{t("variant_label")}<input value={variant.label} onChange={e => setDraft({ ...draft, variants: draft.variants.map((v, n) => n === i ? { ...v, label: e.target.value } : v) })} /></label><label>{t("stock")}<input type="number" min="0" value={variant.stock_quantity ?? ""} onChange={e => setDraft({ ...draft, variants: draft.variants.map((v, n) => n === i ? { ...v, stock_quantity: e.target.value === "" ? null : Number(e.target.value) } : v) })} /></label><button type="button" onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, n) => n !== i) })}>{t("remove")}</button></div>)}<button type="button" onClick={() => setDraft({ ...draft, variants: [...(draft.variants ?? []), { label: "", stock_quantity: null }] })}>{t("add")}</button>{reviewAgain}<button disabled={busy || stale}>{t("save")}</button></form>
    <h4>{t("photos")}</h4><button type="button" disabled={busy||stale} onClick={()=>photoInput.current?.click()}>{t("add")} · {t("photos")}</button><input type="file" hidden ref={photoInput} multiple disabled={busy || stale} accept="image/jpeg,image/png,image/webp" onChange={e => void guarded(() => uploadPhotos(e.target.files))} /><div className="wz-grid">{item.payload.photos?.map((photo, i) => <article key={photo.photo_ref}><p>{t("photos")} {i + 1} · {t(photo.verified ? "ready" : "need_photos")}</p>{photo.image_url && <a href={photo.image_url} target="_blank" rel="noreferrer">{t("photos")}</a>}{["cover", "earlier", "later"].map(direction => <button key={direction} disabled={busy || stale} onClick={() => void guarded(() => itemChange("/photos/order", { photo_ref: photo.photo_ref, direction }))}>{t(direction)}</button>)}{button("remove", async () => { const updated = await request(`${itemPath}/photos/${enc(photo.photo_ref)}?expected_review_version=${item.review_version}`, { method: "DELETE" }) as ImportItem; setItem(updated); setDraft(old => old ? {...old, photos: structuredClone(updated.payload.photos)} : structuredClone(updated.payload)); setJob(await request(jobPath) as Job); setReview(null); setSelection([]); })}</article>)}</div>
    {item.duplicate_candidates.map(candidate => <aside key={candidate.product_ref}><p>{candidate.name} · {candidate.price} {candidate.currency} · {candidate.variants.join(", ")}</p></aside>)}{item.duplicate_candidates.length > 0 && button("create_new", async () => { await confirm(t("create_new"),wenzeActionConfirmation[locale].createNew,()=>itemChange("/duplicate-resolution", { resolution: "create_new" })); })}{button(item.review_state === "skipped" ? "unskip" : "skipped", () => itemChange("/skip", { skipped: item.review_state !== "skipped" }))}</>}
    </>}
    {publication && <section className="wc-card"><h2>{bulk.saved.replace("{n}",String(job.items.filter(row=>row.published_product_ref).length)).replace("{v}",job.store_name)}</h2>{onProducts&&<button onClick={onProducts}>{bulk.see}</button>}{!publication.remaining&&draftRows.length>0&&<button onClick={()=>{setPublication(null);setItemFilter("all");}}>{bulk.review}</button>}<h4>{t("publish")}: {publication.total - publication.remaining} / {publication.total}</h4>{publication.outcomes.map(row => <p key={row.item_ref}>{job.items.find(v => v.item_ref === row.item_ref)?.payload.name} · {t(row.outcome === "pending" ? "remaining" : row.outcome)}</p>)}{publication.remaining > 0 && job.status !== "cancelled" && button("resume", async () => { setPublication(await send(`${jobPath}/publication-runs/${enc(publication.run_ref)}/continue`, { expected_run_version: publication.run_version }) as Run); setJob(await request(jobPath) as Job); })}</section>}
    <div className="wz-actions">{button("pause", async () => { if(!await leaveWork())return;setDraft(null);setMapping({}); setJob(null); setItem(null); setReview(null); setSelection([]); setPublication(null); await loadJobs(); })}{!["published", "cancelled"].includes(job.status) && button("cancel", async () => { await confirm(t("cancel"),t("cancelConfirm"),async()=>{setJob(await send(jobPath + "/cancel", { expected_job_version: job.review_version }) as Job); setItem(null); setReview(null); setSelection([]);}); })}{options.support_url ? <a href={options.support_url} target="_blank" rel="noreferrer">{t("assistance")}</a> : <span>{t("assistance")} &middot; {t("unavailable")}</span>}</div></article>}</>}
    </>}
  </section>;
}
