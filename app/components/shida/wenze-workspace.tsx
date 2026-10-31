"use client";
import {shopText,shopState,canChangeShopVisibility} from "@/app/lib/wenze-shop-copy";
import {WenzeShopTrust} from "./wenze-shop-trust";
import "./wenze-shop-design.css";
import {WenzeProductWizard,WenzeDraftPhotos} from "./wenze-product-wizard";
import {productText} from "@/app/lib/wenze-products-copy";
import "./wenze-products-design.css";
import {sellerImprovements,productMargin} from "@/app/lib/wenze-seller-improvements";
import {useRouter} from "next/navigation";
import {checkoutText,hasPhysicalStore} from "@/app/lib/wenze-checkout-copy";
import choiceCopy from "@/app/lib/wenze-choice-copy.json";
import {WenzeChoiceEditor,choiceError,type ChoiceRow} from "./wenze-choice-editor";
import editorCopy from "@/app/lib/wenze-editor-copy.json";
import {WenzeProductShare} from "./wenze-product-share";
import {WenzeNavigation,WenzeSubnavigation} from "./wenze-navigation";
import {wenzeUX} from "@/app/lib/wenze-ux-copy";
import {WenzeLeaveDialog} from "@/app/lib/wenze-work";

import {WenzeCategoryGuidance, categoryVariantOptions, variantExample} from "./wenze-category-guidance";

import Image from "next/image";
import {WenzeShareShop,WenzePOS} from "./wenze-pos";
import {posText} from "@/app/lib/wenze-pos-copy";
import {useWenzeConfirm} from "./wenze-confirm";
import {wenzeDesignText} from "@/app/lib/wenze-design-copy";
import {SellerWorkspaceIdentity, SellerWorkspaceHeading} from "./seller-workspace";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useWenzeApi, DashboardApiError } from "@/app/lib/wenze-seller-api";
import { useWorkDraft, leaveWork } from "@/app/lib/wenze-work";
import { WenzePaymentPreferences } from "./wenze-payment-preferences";
import { WenzeToday } from "./wenze-today";
import { WenzeOperations } from "./wenze-operations";
import { sellerText } from "@/app/lib/wenze-seller-copy";

import { wenzeCopy, type WenzeKey, type WenzeLocale } from "@/app/lib/wenze-copy";
import "./wenze-workspace.css";
import "./wenze-approved-ux.css";
import "./wenze-product-editor.css";
import { WenzeR6Workspace } from "./wenze-r6-workspace";

type Fields = Record<string, string>;
type Photo = { photo_ref: string; url: string };
type Option = { public_ref: string; label: string; is_available: string; available_stock: number | null; committed_quantity: number };
type Item = { store_type?:unknown; public_ref: string; revision: number; name: string; status: string; visible: string; category: string; city?: string; description?: string; price?: string; currency?: string; condition?: string; price_negotiable?: string; variant_type?: string; available_stock?: number | null; committed_quantity?: number; photos?: Photo[]; variants?: Option[]; catalog_ready?: boolean; order_ready?: boolean; delivery_areas?: string[]; [key: string]: unknown };
type Category = { parent?: string | null; code: string; labels: Record<WenzeLocale, string> };
type Review = { operation_ref: string; revision: number; available_stock?:number|null };
type Plan = { plan: string; source: string; expires_at: string | null; active_products: number; active_product_limit: number; free_import_used: number; free_import_allowance: number; free_import_in_progress: boolean; support_url: string | null };
type Allocation = ChoiceRow;
type Editor = { allocations?: Allocation[]; kind: string; fields: Fields; revision: number; draft_ref?: string; uploads?: string[]; review?: Review; stale?: boolean; latest?: Item };
const enc = encodeURIComponent;

export function WenzeWorkspace({locale}:{locale:WenzeLocale}) {
  const router=useRouter();
  const {request} = useWenzeApi();
  const {confirm,confirmation}=useWenzeConfirm(locale);
  const e=editorCopy[locale], improvements=sellerImprovements[locale];
  const [costAllowed,setCostAllowed]=useState(false);
  type CostDraft={storeRef:string;productRef:string;targets:(string|null)[];amount:string;currency:string};
  const [pendingCost,setPendingCost]=useState<CostDraft|null>(null);
  async function savePurchaseCost(draft:CostDraft){
    let remaining=[...draft.targets];setPendingCost(draft);
    try{for(const variant of draft.targets){
      await request(`wenze/contexts/personal/stores/${enc(draft.storeRef)}/products/${enc(draft.productRef)}/private-cost${variant?'?variant_ref='+enc(variant):''}`,{method:'PUT',body:JSON.stringify({amount:draft.amount,currency:draft.currency,expected_revision:0})});
      remaining=remaining.slice(1);setPendingCost(remaining.length?{...draft,targets:remaining}:null);
    }setNotice(improvements.saved);return true;}
    catch(caught){if(caught instanceof DashboardApiError&&[401,403,404].includes(caught.status)){setPendingCost(null);throw caught;}setNotice(improvements.pending);return false;}
  }
  const pc=(key:string)=>productText(locale,key);
  const d=(key:string)=>wenzeDesignText(locale,key);

  const [shopTab,setShopTab]=useState("products"),[notice,setNotice]=useState("");
  const [checkingSeller,setCheckingSeller]=useState(true),[sellerCheckFailed,setSellerCheckFailed]=useState(false),[checkAttempt,setCheckAttempt]=useState(0);
  const [view,setView]=useState("today");
  const [dashboardOrder,setDashboardOrder]=useState<string|undefined>();
  const st=(key:string)=>sellerText(locale,key);
  const t = (key: string) => key==="options"?wenzeUX(locale,"options"):key==="quick"?e.quick:key==="detailed"?e.detailed:wenzeCopy[locale][key as WenzeKey] ?? "—";
  const context="personal";
  const [stores, setStores] = useState<Item[]>([]), [store, setStore] = useState<Item | null>(null), [product, setProduct] = useState<Item | null>(null);
  const [products, setProducts] = useState<Item[]>([]), [categories, setCategories] = useState<Category[]>([]), [productCategories,setProductCategories]=useState<Category[]>([]), [currencies, setCurrencies] = useState<string[]>(["CDF", "USD"]);
  const [archived, setArchived] = useState(false), [filter, setFilter] = useState("active"), [search, setSearch] = useState(""), [offset, setOffset] = useState(0), [total, setTotal] = useState(0);
  const [uploadPreviews,setUploadPreviews]=useState<Record<string,string>>({});
  const [editor, setEditor] = useState<Editor | null>(null), [plan, setPlan] = useState<Plan | null>(null), [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const canGovern = true;
  const [productDirty,setProductDirty]=useState(false);
  const [editorDirty,setEditorDirty]=useState(false);
  const editorHeading=useRef<HTMLHeadingElement>(null);
  const editorKind=editor?.kind,editingProduct=product?.public_ref;
  useEffect(()=>{
    if(!editorKind)return;
    const frame=requestAnimationFrame(()=>{editorHeading.current?.focus({preventScroll:true});editorHeading.current?.scrollIntoView({block:"start",behavior:"auto"});});
    return()=>cancelAnimationFrame(frame);
  },[editorKind,editingProduct]);
  const editorFormId=useId();
  const [productTab,setProductTab]=useState("details");
  const u=(key:Parameters<typeof wenzeUX>[1])=>wenzeUX(locale,key);
  useEffect(()=>{if(!editor)setEditorDirty(false);},[editor]);
  useEffect(()=>setProductDirty(false),[product?.public_ref,product?.revision]);
  useEffect(()=>{if(product&&!editorDirty)setEditor(old=>old?.kind==="product"&&old.revision!==product.revision?{...old,revision:product.revision}:old);},[product,editorDirty]);
  useWorkDraft(editorDirty||productDirty||!!pendingCost, st("leave"));
  const generation = useRef(0),writeLock=useRef(false);
  const root = `wenze/contexts/${enc(context)}/stores`, storePath = `${root}/${enc(store?.public_ref ?? "")}`, productPath = `${storePath}/products/${enc(product?.public_ref ?? "")}`;

  useEffect(()=>{
    if(view!=="shop"||shopTab!=="settings"||!store?.public_ref)return;
    let current=true;setPlan(null);
    request(`${storePath}/plan`).then(value=>{if(current)setPlan(value as Plan);}).catch(()=>{if(current)setError("unavailable");});
    return()=>{current=false;};
  },[view,shopTab,store?.public_ref,storePath,request]);

  useEffect(() => {
    if (!context) return;
    const ticket = ++generation.current;
    setCheckingSeller(true); setSellerCheckFailed(false);
    setStore(null); setProduct(null); setProducts([]); setEditor(null); setPreview(null); setPlan(null); setError(""); setStores([]);
    request(`${root}?archived=${archived}`).then(async value => {
      if (ticket !== generation.current) return;
      const data = value as { stores: Item[]; categories: Category[]; product_categories?: Category[]; currencies?: string[] }; data.stores=data.stores.filter(row=>row.selling_mode!=="individual");setStores(data.stores); setCategories(data.categories); setProductCategories(data.product_categories ?? data.categories); setCurrencies(data.currencies?.length ? data.currencies : ["CDF", "USD"]);
      const params = new URLSearchParams(window.location.search), storeRef = params.get("store"), productRef = params.get("product");
      if (!storeRef && data.stores.length===1 && !archived) {setStore(data.stores[0]);await loadProducts(data.stores[0],0);}
      if (!storeRef && params.get("view")==="catalog")setView("catalog");
      if (storeRef) {
        const [selected, selectedProduct] = await Promise.all([request(`${root}/${enc(storeRef)}`), productRef ? request(`${root}/${enc(storeRef)}/products/${enc(productRef)}`) : Promise.resolve(null)]) as Item[];
        if(selected.selling_mode==="individual"){router.replace(`${locale==="en"?"":`/${locale}`}/shida/wenze/sell`);return;}
        if (ticket === generation.current) { setStore(selected); setProduct(selectedProduct); if(productRef)setView("catalog"); if(selected.status==="active")await loadProducts(selected,0); const destination=params.get("view");if(destination==="shop")setShopTab(selected.status==="active"?"shopDetails":"settings");if(destination&&["today","catalog","orders","imports","inventory","sales","costs","expenses","money","reports","schedules","receipts","shop"].includes(destination))setView(destination); }
      }
    }).catch(() => { if (ticket === generation.current) {setError("unavailable");setSellerCheckFailed(true);} }).finally(()=>{if(ticket===generation.current)setCheckingSeller(false);});
  }, [context, archived, checkAttempt]); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(work: () => Promise<void>) {
    if(writeLock.current)return;writeLock.current=true;
    setBusy(true); setError(""); setNotice(""); const ticket = generation.current;
    try { await work(); }
    catch (caught) {
      if (ticket !== generation.current) return;
      if(caught instanceof DashboardApiError && ["wenze_active_customer_activity","wenze_active_stock_obligation","wenze_active_stock_count","wenze_shared_inventory_reconciliation_required","wenze_allocation_mismatch"].includes(caught.detail??"")){
        const key=caught.detail==="wenze_active_stock_count"?"count":caught.detail==="wenze_shared_inventory_reconciliation_required"?"reconcile":caught.detail==="wenze_allocation_mismatch"?"mismatch":"active";
        setError("choices:"+key);
      } else if (caught instanceof DashboardApiError && caught.kind === "conflict") {
        setError("conflict");
        try {
          const editingStore = editor?.kind === "store" || editor?.kind === "fulfillment";
          const latest = await request(product && !editingStore ? productPath : storePath) as Item;
          if (ticket !== generation.current) return;
          if (product && !editingStore) setProduct(latest); else setStore(latest);
          let review: Review | undefined;
          if (editor?.review) review = await send(`${productPath}/operations/${editor.kind === "duplicate" ? "duplication" : "conversion"}/preflight`, "POST", {}) as Review;
          setEditor(old => old ? { ...old, revision: review?.revision ?? latest.revision, review: review ?? old.review, stale: true, latest } : null);
        } catch { setError("unavailable"); setStore(null); setProduct(null); setEditor(null); }
      } else if (caught instanceof DashboardApiError && [401,403,404].includes(caught.status)) { setError("unavailable"); setPendingCost(null);setStore(null); setProduct(null); setStores([]); setProducts([]); setEditor(null); setPreview(null); setPlan(null); } else if (caught instanceof DashboardApiError && caught.kind === "validation") setError("validation");
      else { setError("unavailable"); }
    } finally { writeLock.current=false;setBusy(false); }
  }
  async function send(path: string, method: string, data: unknown) { return request(path, { method, body: JSON.stringify(data) }); }
  async function reloadStores() { const data = await request(`${root}?archived=${archived}`) as { stores: Item[] }; data.stores=data.stores.filter(row=>row.selling_mode!=="individual");setStores(data.stores); }
  const [labelSelection,setLabelSelection]=useState<string[]>([]),[batchLabels,setBatchLabels]=useState(false);
  async function loadProducts(selected = store, page = offset, status = filter, query = search) {
    if (!selected) return;
    const data = await request(`${root}/${enc(selected.public_ref)}/products?status=${enc(status)}&search=${enc(query)}&offset=${page}&limit=20`) as { products: Item[]; total: number };
    setProducts(data.products); setTotal(data.total); setOffset(page);setLabelSelection([]);setBatchLabels(false);
  }
  function fieldsOf(item: Item, names: string[]): Fields { return Object.fromEntries(names.map(key => [key, Array.isArray(item[key]) ? (item[key] as string[]).join("\n") : String(item[key] ?? "")])); }
  const sc=(key:string)=>shopText(locale,key);
  const shopFields = ["name", "category", "description", "city", "area", "commune", "quartier", "store_type"];
  const productFields = ["name", "price", "currency", "category", "condition", "description", "price_negotiable"];
  async function openChoices(current: Item) {
    const review=await send(`${productPath}/operations/conversion/preflight`, "POST", {}) as Review;
    setEditor({kind:"conversion",revision:review.revision,review,allocations:current.variant_type?undefined:[],fields:{mode:current.variant_type?"single":"variants",variant_type:categoryVariantOptions(current.category)[0],available_quantity:String(current.available_stock??""),allocations:""}});
    setEditorDirty(false);
  }
  async function openEditor(kind: string) {
    if((editorDirty||productDirty)&&!await leaveWork())return;
    setPreview(null); setPlan(null); setError("");setNotice("");
    if (kind === "createStore") { setEditor({ kind, revision: 1, fields: { name: "", category: categories[0]?.code ?? "", city: "", description: "", publication_ref: crypto.randomUUID() } }); return; }
    if (kind === "quick" || kind === "detailed") {
      setUploadPreviews({});setCostAllowed(false);const access=await request(`${storePath}/plan`) as Plan;setCostAllowed(access.plan==="pro");
      const draft = await send(`${storePath}/drafts`, "POST", {}) as { draft_ref: string; revision: number };
      setEditor({ kind, ...draft, uploads: [], fields: { name: "", price: "", currency: "CDF", category: store?.category ?? "", condition: "unspecified", description: "", price_negotiable: "no", available_quantity: "", variant_type: "", allocations: "" } }); return;
    }
    if (!store) return;
    if (kind === "store") setEditor({ kind, revision: store.revision, fields: fieldsOf(store, shopFields) });
    if (kind === "fulfillment") setEditor({ kind, revision: store.revision, fields: { ...fieldsOf(store, ["fulfillment_mode", "area", "commune", "quartier", "address", "landmark", "delivery_fee_type", "delivery_fee", "delivery_currency", "delivery_areas", "preparation_estimate", "delivery_estimate"]), consent: "no" } });
    if (kind === "product" && product) {setProductTab("details");setEditor({ kind, revision: product.revision, fields: fieldsOf(product, productFields) });}
    if(kind==="conversion"&&product){await openChoices(product);return;}
    if (kind === "duplicate" && product) {
      const review=await send(`${productPath}/operations/duplication/preflight`, "POST", {}) as Review;
      setEditor({kind,revision:review.revision,review,fields:{name:product.name,price:product.price??"",currency:product.currency??"CDF",stock_policy:"zero"}});
    }
  }
  function change(key: string, value: string) { setEditorDirty(true); setEditor(old => old ? { ...old, kind:["quick","detailed"].includes(old.kind)&&["condition","description","price_negotiable","available_quantity"].includes(key)?"detailed":old.kind, fields: { ...old.fields, [key]: value } } : null); }
  function categoryFields(){
    if(!editor)return null;
    const value=editor.fields.category||"other",parent=value.split(":")[0];
    const children=productCategories.filter(row=>row.parent===parent);
    return <><label>{e.category}<select value={parent} onChange={event=>change("category",event.target.value)}>{categories.map(row=><option key={row.code} value={row.code}>{row.labels[locale]}</option>)}</select></label>
      <label>{e.type}<select value={value} onChange={event=>change("category",event.target.value)}><option value={parent}>{e.general}</option>{children.map(row=><option key={row.code} value={row.code}>{row.labels[locale]}</option>)}</select></label><p className="wz-category-help">{e.independent}</p></>;
  }
  function input(key: string, options?: string[], required = false) {
    if (!editor) return null;
    return <label key={key}>{key==="variant_type"?e.choiceType:t(key === "mode" ? "conversion" : key === "fulfillment_mode" ? "fulfillment" : key === "available_quantity" ? "available" : key)}{options ? <select value={editor.fields[key] ?? ""} required={required} onChange={event => change(key, event.target.value)}><option value="">—</option>{options.map(option => <option key={option} value={option}>{key === "currency" || key === "delivery_currency" ? option : key==="mode" ? (option==="single"?e.single:e.multiple) : key==="variant_type"&&option==="option"?e.customChoices:t(option)}</option>)}</select> : key === "category" ? <select value={editor.fields[key]} required onChange={event => change(key, event.target.value)}>{categories.map(category => <option key={category.code} value={category.code}>{category.labels[locale]}</option>)}</select> : ["description", "delivery_areas"].includes(key) ? <textarea value={editor.fields[key] ?? ""} onChange={event => change(key, event.target.value)} /> : <input value={editor.fields[key] ?? ""} required={required} inputMode={["price", "delivery_fee", "available_quantity"].includes(key) ? "decimal" : "text"} onChange={event => change(key, event.target.value)} />}</label>;
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy || !editor || editor.stale) return;
    const continueChoices=(event.nativeEvent as SubmitEvent).submitter?.getAttribute("data-continue")==="choices";
    if((editor.kind==="conversion"&&editor.fields.mode==="variants"||editor.kind==="detailed"&&editor.fields.variant_type)&&choiceError(editor.allocations??[],editor.kind==="conversion"?editor.review?.available_stock:undefined))return;
    await run(async () => {
      const f = editor.fields, rev = { expected_revision: editor.revision };
      if (editor.kind === "createStore") { await send(root, "POST", f); await reloadStores(); }
      else if (editor.kind === "store") { setStore(await send(storePath, "PATCH", { ...rev, fields: Object.fromEntries(Object.entries(f).filter(([key, value]) => key !== "store_type" || value)) }) as Item); await reloadStores(); }
      else if (editor.kind === "fulfillment") {
        const { consent, ...fields } = f;
        setStore(await send(`${storePath}/fulfillment`, "PUT", { ...rev, public_address_confirmed: consent === "yes", fields: { ...fields, store_type: fields.fulfillment_mode === "delivery" ? "online_only" : "online_and_physical", delivery_areas: fields.delivery_areas.split("\n").filter(Boolean) } }) as Item);
      } else if (editor.kind === "quick" || editor.kind === "detailed") {
        const { available_quantity, variant_type, purchase_price, allocations: unused, ...fields } = f;
        void unused;
        const variants = variant_type ? (editor.allocations ?? []).map(row => ({ label: row.label, ...(row.attributes?{option_attributes:row.attributes}:{}), stock_quantity: row.quantity === "" ? null : Number(row.quantity) })) : [];
        const created = await send(`${storePath}/products`, "POST", { ...rev, ...fields, mode: editor.kind, draft_ref: editor.draft_ref, upload_refs: editor.uploads, stock_quantity: available_quantity === "" ? null : Number(available_quantity), variant_type: variant_type || null, variants }) as Item;
        setProduct(created);setEditor(null);setEditorDirty(false);setProductTab("details");
        if(purchase_price?.trim()&&costAllowed){
          await savePurchaseCost({storeRef:store!.public_ref,productRef:created.public_ref,targets:created.variants?.length?created.variants.map(v=>v.public_ref):[null],amount:purchase_price.trim().replace(',','.'),currency:f.currency});
          await loadProducts();return;
        }
        await loadProducts();
      } else if (editor.kind === "product") { const updated=await send(productPath, "PATCH", { ...rev, fields: f }) as Item;setProduct(updated);setEditor({kind:"product",revision:updated.revision,fields:fieldsOf(updated,productFields)});setEditorDirty(false);setNotice(d("savedNotice"));await loadProducts();if(continueChoices&&!updated.variant_type)await openChoices(updated);return; }
      else if (editor.kind === "conversion" || editor.kind === "duplicate") {
        const fields = editor.kind === "duplicate" ? f : { mode: f.mode, variant_type: f.variant_type, available_quantity: f.available_quantity === "" ? null : Number(f.available_quantity), allocations: (editor.allocations ?? []).map(row => ({ label: row.label, ...(row.attributes?{option_attributes:row.attributes}:{}), available_quantity: row.quantity === "" ? null : Number(row.quantity) })) };
        const outcome = await send(`${productPath}/operations/confirm`, "POST", { ...rev, operation_ref: editor.review?.operation_ref, fields }) as { product_ref: string };
        setProduct(await request(`${storePath}/products/${enc(outcome.product_ref)}`) as Item); await loadProducts();
      }
      setEditor(null); setEditorDirty(false);setProductTab("details"); setNotice(d("savedNotice"));
    });
  }
  async function files(list: FileList | null, replace?: string) {
    if (!list || !store) return;
    await run(async () => {
      const refs = [...(editor?.uploads ?? [])]; let current = product;
      if (list.length + (editor?.draft_ref ? refs.length : replace ? 0 : current?.photos?.length ?? 0) > 5) throw new DashboardApiError("validation", 422);
      for (const file of Array.from(list)) {
        if (file.size > 8 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new DashboardApiError("validation", 422);
        const content = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(file); });
        const uploaded = await send(`${storePath}/uploads`, "POST", { target_type: editor?.draft_ref ? "product_draft" : "product", target_ref: editor?.draft_ref ?? current?.public_ref, content_base64: content }) as { upload_ref: string };
        if (editor?.draft_ref) { refs.push(uploaded.upload_ref);setUploadPreviews(old=>({...old,[uploaded.upload_ref]:`data:${file.type};base64,${content}`}));setEditorDirty(true); setEditor(old => old ? { ...old, uploads: [...refs] } : null); }
        else if (current) current = await send(productPath + "/photos", "POST", { expected_revision: current.revision, action: replace ? "replace" : "add", photo_ref: replace, upload_ref: uploaded.upload_ref }) as Item;
        if (!editor?.draft_ref) setProduct(current);
      }
      if (editor?.draft_ref) setEditor(old => old ? { ...old, uploads: refs } : null); else setProduct(current);
    });
  }
  async function shopPhoto(file?:File,remove=false){
    if(!store)return;
    await run(async()=>{
      let upload_ref:string|undefined;
      if(!remove){
        if(!file||file.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))throw new DashboardApiError("validation",422);
        const content_base64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.readAsDataURL(file);});
        const uploaded=await send(`${storePath}/uploads`,"POST",{target_type:"store_profile",target_ref:store.public_ref,content_base64}) as {upload_ref:string};upload_ref=uploaded.upload_ref;
      }
      const updated=await send(`${storePath}/profile-photo`,"PUT",{expected_revision:store.revision,upload_ref:upload_ref??null}) as Item;setStore(updated);setEditor(old=>old?.kind==="store"?{...old,revision:updated.revision}:old);setNotice(d("savedNotice"));await reloadStores();
    });
  }
  async function lifecycle(action: string, entity: Item, path: string) {
    if (!await confirm(t(action),d(action+"Help"))) return;
    await run(async () => { const updated = await send(`${path}/lifecycle/${action}`, "POST", { expected_revision: entity.revision }) as Item; if (entity.public_ref.startsWith("WNP_")) { setProduct(updated); await loadProducts(); } else { setStore(updated); await reloadStores(); } setNotice(d("savedNotice")); });
  }
  async function selectProductTab(tab:string){
    if(!await leaveWork())return;setError("");setNotice("");setProductDirty(false);setEditorDirty(false);setProductTab(tab);
    setEditor(null);
  }
  const productNavigation=product&&<nav className="wz-section-tabs" aria-label={product.name}>{["details","photos","options","labels"].map(tab=><button key={tab} disabled={busy} aria-current={productTab===tab?"page":undefined} onClick={()=>void selectProductTab(tab)}>{tab==="labels"?posText(locale,"labels"):tab==="photos"?t("photos"):tab==="options"?e.stock:u("details")}</button>)}</nav>;
  function stockForm(variant?: Option) {
    if (!product) return null;
    const available = variant ? variant.available_stock : product.available_stock;
    return <form className="wz-inline" onChange={()=>setProductDirty(true)} key={`${product.revision}-${variant?.public_ref ?? "single"}`} onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(async () => { setProduct(await send(`${productPath}/stock`, "PUT", { expected_revision: product.revision, variant_ref: variant?.public_ref, available_quantity: form.get("tracked") === "yes" ? Number(form.get("quantity")) : null }) as Item);setNotice(d("savedNotice")); }); }}><label>{t("stock")}<select name="tracked" defaultValue={available == null ? "no" : "yes"}><option value="no">{t("untracked")}</option><option value="yes">{t("tracked")}</option></select></label><label>{t("available")}<input name="quantity" type="number" min="0" step="1" defaultValue={available ?? 0} /></label><span>{t("committed")}: {variant?.committed_quantity ?? product.committed_quantity ?? 0}</span><button disabled={busy}>{t("save")}</button><button disabled={busy} type="button" onClick={() => void run(async () => setProduct(await send(`${productPath}/stock`, "PUT", { expected_revision: product.revision, variant_ref: variant?.public_ref, available_quantity: 0 }) as Item))}>{t("soldOut")}</button></form>;
  }
  function variantAction(action: string, variant?: Option, label?: string) { return run(async () => { const updated=await send(`${productPath}/variants`, "POST", { expected_revision: product?.revision, action, variant_ref: variant?.public_ref, label, available_quantity: null }) as Item;setProduct(updated);setEditor(old=>old?.kind==="product"?{...old,revision:updated.revision}:old); setNotice(d("savedNotice")); }); }
  const button = (label: string, action: () => void) => <button type="button" className={["quick","create"].includes(label)?"seller-primary":undefined} disabled={busy} onClick={action}>{t(label)}</button>;
  if(checkingSeller||sellerCheckFailed)return <main className="rst container wz-seller-setup seller-setup"><p role={sellerCheckFailed?"alert":"status"}>{sellerCheckFailed?st("sellerCheckFailed"):st("checkingSeller")}</p>{sellerCheckFailed&&<button onClick={()=>setCheckAttempt(value=>value+1)}>{st("refresh")}</button>}</main>;
  if(!stores.length&&!store)return <main className="rst container wz-seller-setup seller-setup"><WenzeLeaveDialog locale={locale}/><p className="eyebrow">SHIDA / WENZE</p><h1>{st("setupTitle")}</h1><p>{st("setupNote")}</p>{error&&<p role="alert">{error.startsWith("choices:")?choiceCopy[locale][error.slice(8) as keyof typeof choiceCopy.en]:t(error)}</p>}{editor?.kind==="createStore"?<form onSubmit={save}><h2>{t("create")}</h2><div className="wz-fields">{[input("name",undefined,true),input("category"),input("city",undefined,true),input("description")]}</div><button className="button button-primary" disabled={busy}>{t("save")}</button><button disabled={busy} onClick={()=>setEditor(null)} type="button">{t("cancel")}</button></form>:<button className="button button-primary" onClick={()=>void openEditor("createStore")}>{t("create")}</button>}<label className="wz-archived-choice"><input type="checkbox" checked={archived} onChange={event=>setArchived(event.target.checked)}/>{t("archived")}</label></main>;
  const displayView=view==="sales"&&!hasPhysicalStore(store)?"orders":view;
  async function navigate(tab:string){
    if(tab==="sales"&&!hasPhysicalStore(store))tab="orders";
    if(!await leaveWork())return;
    setEditor(null);setEditorDirty(false);setProductDirty(false);setPendingCost(null);setPreview(null);setPlan(null);
    setView(tab);setDashboardOrder(undefined);setProduct(null);if(tab==="shop"){setShopTab("shopDetails");setProduct(null);}else if(tab==="catalog")setShopTab("products");
    if(tab==="catalog"&&store)void run(()=>loadProducts(store,0));
    const url=new URL(window.location.href);url.searchParams.set("view",tab);url.searchParams.delete("product");if(store)url.searchParams.set("store",store.public_ref);window.history.replaceState(null,"",url);
  }
  return <main className={`rst container rst-management wz-personal seller-workspace ${displayView==="shop"?"ws-shop":""} ${product?"wz-editing-product":""}`}><div className="rst-management-layout seller-layout">
    <aside className="rst-management-sidebar seller-sidebar"><SellerWorkspaceIdentity mark="W" title="Wenze" subtitle={t("personal")}/>
      <WenzeNavigation physical={hasPhysicalStore(store)} locale={locale} view={displayView} onNavigate={tab=>void navigate(tab)}/>

    </aside><div className="rst-management-content wz seller-content"><WenzeLeaveDialog locale={locale}/>
    <SellerWorkspaceHeading eyebrow="Wenze" title={displayView==="money"?u("money"):displayView==="shop"?u("shop"):displayView==="catalog"?u("productsStock"):displayView==="sales"?checkoutText(locale,"counter"):displayView==="receipts"?posText(locale,"receipts"):st(displayView)} actions={store&&<>{stores.length>1?<label className="wz-store-selector"><span className="wz-visually-hidden">{t("shops")}</span><select value={store.public_ref} disabled={busy} onChange={async event=>{const ref=event.target.value;if(!await leaveWork())return;await run(async()=>{
      const selected=await request(`${root}/${enc(ref)}`) as Item;
      setEditor(null);setEditorDirty(false);setProductDirty(false);setPendingCost(null);setProduct(null);setPreview(null);setPlan(null);setProducts([]);setSearch("");setFilter("active");setStore(selected);setDashboardOrder(undefined);setShopTab(view==="shop"?"shopDetails":"products");
      const destination=view==="sales"&&!hasPhysicalStore(selected)?"orders":view;setView(destination);
      const url=new URL(window.location.href);url.searchParams.set("store",ref);url.searchParams.set("view",destination);url.searchParams.delete("product");url.searchParams.delete("count");window.history.replaceState(null,"",url);
      if(destination==="catalog")await loadProducts(selected,0,"active","");
    });}}>{stores.map(row=><option key={row.public_ref} value={row.public_ref}>{row.name}</option>)}</select></label>:<span className="wz-current-shop">{store.name}</span>}</>}/>
    <WenzeSubnavigation locale={locale} view={displayView} onNavigate={tab=>void navigate(tab)}/>
    {displayView==="today"?<WenzeToday key={store?.public_ref??"none"} store={store} stores={stores} locale={locale} onChoose={row=>{setStore(row as Item);setProduct(null);}} onNavigate={tab=>void navigate(tab)} onOpenOrder={ref=>void navigate("orders").then(()=>setDashboardOrder(ref))}/>:displayView==="orders"||displayView==="imports"?<WenzeR6Workspace key={`${displayView}:${store?.public_ref}:${dashboardOrder??""}`} context={context} locale={locale} initialView={displayView} initialOrder={dashboardOrder} initialStore={store?.public_ref} ordersOnly={displayView==="orders"}/>:!["catalog","shop"].includes(displayView)?<WenzeOperations categoryOptions={productCategories} key={`${store?.public_ref}:${displayView}`} store={store} locale={locale} view={displayView==="money"?"reports":displayView} summaryOnly={displayView==="money"} onChoose={()=>setView("catalog")}/>:<>
    {confirmation}{pendingCost&&<div role="status"><p>{improvements.pending}</p><button disabled={busy} onClick={()=>void run(async()=>{await savePurchaseCost(pendingCost);})}>{improvements.retry}</button></div>}{notice&&<p role="status">{notice}</p>}{error && <p role="alert">{error.startsWith("choices:")?choiceCopy[locale][error.slice(8) as keyof typeof choiceCopy.en]:t(error)}</p>}{busy && <p role="status">{t("loading")}</p>}
    {!store ? <section><h2>{t("shops")}</h2><div className="wz-actions">{canGovern && button("create", () => void openEditor("createStore"))}<label><input type="checkbox" checked={archived} onChange={event => setArchived(event.target.checked)} />{t("archived")}</label></div>{stores.length === 0 && <p>{t("empty")}</p>}<div className="wz-grid">{stores.map(row => <button className="wz-card" key={row.public_ref} onClick={() => void run(async () => { setStore(await request(`${root}/${enc(row.public_ref)}`) as Item); if(row.status==="active")await loadProducts(row, 0);else{setView("shop");setShopTab("settings");} })}><strong>{row.name}</strong><span>{row.city}</span><span>{t(row.catalog_ready ? "ready" : "setup")}</span></button>)}</div></section> : <>
      {displayView==="shop"&&<section className="wz-shop-header"><div className="wz-shop-identity">{typeof store.profile_image_url==="string"&&store.profile_image_url?<Image unoptimized src={store.profile_image_url} alt="" width={64} height={64}/>:<span className="wz-photo-fallback">{(store.name||'').slice(0,1)}</span>}<div><h2>{store.name}</h2><span className="wz-status">{["suspended","unknown"].includes(shopState(store.status,store.visible))?sc(shopState(store.status,store.visible)):t(shopState(store.status,store.visible))}</span><p>{categories.find(c=>c.code===store.category)?.labels[locale]??store.category}</p><p>{[store.city,store.commune,store.area].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(" · ")}</p></div>{store.status==="active"&&store.visible==="true"&&store.catalog_ready&&<a href={`/shida/wenze/${encodeURIComponent(store.public_ref)}`} target="_blank" rel="noreferrer">{sc("view")} ↗</a>}</div>
      <nav hidden={view!=="shop"} className="wz-shop-tabs" aria-label={t("shops")}>{(displayView==="shop"?["shopDetails","fulfillment","settings"]:[]).map(tab=><button key={tab} aria-current={shopTab===tab?"page":undefined} disabled={busy} onClick={async()=>{if(!await leaveWork())return;setEditorDirty(false);setProductDirty(false);setShopTab(tab);setProduct(null);setEditor(null);setPreview(null);setPlan(null);if(tab==="fulfillment"&&store.status==="active")setEditor({kind:"fulfillment",revision:store.revision,fields:{...fieldsOf(store,["fulfillment_mode","area","commune","quartier","address","landmark","delivery_fee_type","delivery_fee","delivery_currency","delivery_areas","preparation_estimate","delivery_estimate"]),consent:"no"}});}}>{["shopDetails","settings"].includes(tab)?d(tab):t(tab)}</button>)}</nav></section>}
      {shopTab==="shopDetails"&&<section className="wz-shop-photo"><h3>{d("shopPhoto")}</h3><p>{d("photoHelp")}</p>{typeof store.profile_image_url==="string"&&!!store.profile_image_url&&<Image unoptimized src={store.profile_image_url} alt={store.name} width={100} height={100}/>}<label className="ws-upload">{sc("photo")}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||store.status!=="active"} onChange={e=>{void shopPhoto(e.target.files?.[0]);e.target.value="";}}/></label>{!!store.profile_image_url&&<button disabled={busy||store.status!=="active"} onClick={()=>void shopPhoto(undefined,true)}>{t("remove")}</button>}</section>}
      {!editor&&["shopDetails","fulfillment"].includes(shopTab)&&<section><h3>{shopTab==="shopDetails"?d("shopDetails"):t("fulfillment")}</h3><dl className="ws-facts">{(shopTab==="shopDetails"?shopFields:["fulfillment_mode","preparation_estimate","delivery_estimate","area","commune","quartier","address","landmark","delivery_fee_type","delivery_fee","delivery_currency","delivery_areas"]).map(key=><div className={key==="description"?"ws-description":undefined} key={key}><dt>{t(key==="fulfillment_mode"?"fulfillment":key)}</dt><dd>{key==="category"?(categories.find(c=>c.code===store.category)?.labels[locale]??store.category):["store_type","fulfillment_mode","delivery_fee_type"].includes(key)?(store[key]?t(String(store[key])):"—"):Array.isArray(store[key])?(store[key] as string[]).join(", "):String(store[key]??"—")}</dd></div>)}</dl><button disabled={store.status!=="active"} onClick={()=>void openEditor(shopTab==="shopDetails"?"store":"fulfillment")}>{t("edit")}</button></section>}
      {shopTab==="settings"&&<><WenzeShopTrust status={store.status} locale={locale}/><section><h3>{sc("visibility")}</h3><div className="ws-visibility">{["active","hidden","archived"].map(state=><button key={state} aria-pressed={shopState(store.status,store.visible)===state} disabled={busy||!canChangeShopVisibility(store.status)||shopState(store.status,store.visible)===state||(store.status!=="active"&&state==="active")} onClick={()=>void lifecycle(state==="archived"?"archive":store.status!=="active"?"restore":state==="active"?"show":"hide",store,storePath)}><strong>{t(state)}</strong><small>{sc(state==="active"?"activeHelp":state==="hidden"?"hiddenHelp":"archiveHelp")}</small></button>)}</div>{canChangeShopVisibility(store.status)&&store.status!=="active"&&<p>{d("restoreHelp")}</p>}<details><summary>{d("shopActions")}</summary><WenzeShareShop key={store.public_ref} storeRef={store.public_ref} locale={locale}/>{canGovern&&button("shops",async()=>{if(!await leaveWork())return;setStore(null);setProduct(null);setEditor(null);setPlan(null);setView("catalog");})}</details></section></>}

      {shopTab==="products"&&product&&<section className="wz-product-heading"><div className="wz-actions">{button("back", async () => { if(!await leaveWork())return; setProduct(null); setEditor(null); setPreview(null); })}</div><div className="wp-product-summary">{product.photos?.[0]?.url&&<Image unoptimized src={product.photos[0].url} alt="" width={120} height={140}/>}<div><h2>{product.name}</h2><p><strong>{product.price} {product.currency}</strong></p><p>{productCategories.find(c=>c.code===product.category)?.labels[locale]??categories.find(c=>c.code===product.category)?.labels[locale]}</p><p>{t("available")}: {product.available_stock??t("untracked")}</p><span className="wz-status">{t(product.status!=="active"?"archived":product.visible==="true"?"active":"hidden")}</span></div></div><div className="wz-actions"><button disabled={busy} onClick={()=>void run(async()=>setPreview(await request(`${productPath}/preview`) as Record<string,unknown>))}>{e.share}</button><details className="wz-more-actions"><summary>{e.more}</summary>{product.status === "active" && <>{button("duplicate", () => void run(() => openEditor("duplicate")))}</>}{button(product.status !== "active" ? "restore" : product.visible === "true" ? "hide" : "show", () => void lifecycle(product.status !== "active" ? "restore" : product.visible === "true" ? "hide" : "show", product, productPath))}{product.status === "active" && button("archive", () => void lifecycle("archive", product, productPath))}</details></div>{productNavigation}</section>}
      {shopTab==="products"&&!editor&&(!product ? <section className="wp-catalog"><p>{pc("intro")}</p><div className="wz-actions">{store.status === "active" && store.catalog_ready && <><button className="seller-primary" disabled={busy} onClick={()=>void run(()=>openEditor("quick"))}>{pc("add")}</button></>}</div><form className="wz-inline" onSubmit={event => { event.preventDefault(); void run(() => loadProducts(store, 0)); }}><label>{t("search")}<input value={search} onChange={event => setSearch(event.target.value)} /></label><label>{t("status")}<select value={filter} onChange={event => setFilter(event.target.value)}>{["active", "hidden", "archived", "all"].map(value => <option key={value} value={value}>{t(value)}</option>)}</select></label><button disabled={busy}>{t("search")}</button></form><p role="status">{!busy&&!error&&total>0&&`${total} · ${t("products")}`}</p>{!busy&&!error&&!total&&<div className="wp-empty"><h3>{pc(search||filter!=="active"?"noMatch":"empty")}</h3>{!search&&filter==="active"&&<p>{pc("emptyHelp")}</p>}</div>}{labelSelection.length>0&&<div className="wz-actions"><button onClick={()=>setBatchLabels(!batchLabels)}>{posText(locale,"labels")} ({labelSelection.length})</button></div>}{batchLabels&&labelSelection.length>0&&<WenzePOS key={labelSelection.join(",")} store={store} locale={locale} labelsOnly labelProductRefs={labelSelection}/>}<div className="wz-table wz-product-list"><table><thead><tr><th>{posText(locale,"labelSelect")}</th><th>{t("name")}</th><th>{t("price")}</th><th>{t("status")}</th><th>{t("available")}</th><th>{t("manage")}</th></tr></thead><tbody>{products.map(row => <tr key={row.public_ref}><td><input type="checkbox" aria-label={`${posText(locale,"labelSelect")}: ${row.name}`} checked={labelSelection.includes(row.public_ref)} onChange={event=>{setBatchLabels(false);setLabelSelection(old=>event.target.checked?[...old,row.public_ref]:old.filter(ref=>ref!==row.public_ref));}}/></td><td className="wz-product-name">{row.photos?.[0]?.url?<Image unoptimized src={row.photos[0].url} alt="" width={56} height={70}/>:<span className="wz-photo-fallback">{row.name.slice(0,1)}</span>}<span><strong>{row.name}</strong><small>{productCategories.find(c=>c.code===row.category)?.labels[locale]??categories.find(c=>c.code===row.category)?.labels[locale]}</small></span></td><td data-label={t("price")}>{new Intl.NumberFormat(locale).format(Number(row.price))} {row.currency}</td><td data-label={t("status")}>{t(row.status !== "active" ? "archived" : row.visible === "true" ? "active" : "hidden")}</td><td data-label={t("available")}>{row.available_stock ?? t("untracked")}</td><td><button onClick={() => void run(async () => { const selected=await request(`${storePath}/products/${enc(row.public_ref)}`) as Item;setProduct(selected);setEditor(null);setEditorDirty(false);setProductTab("details"); setPreview(null); setPlan(null); })}>{t("manage")}</button></td></tr>)}</tbody></table></div><div className="wz-actions" hidden={total<=20}><button disabled={busy || offset === 0} onClick={() => void run(() => loadProducts(store, Math.max(0, offset - 20)))}>{t("previous")}</button><span>{Math.min(total, offset + 1)}–{Math.min(total, offset + 20)} / {total}</span><button disabled={busy || offset + 20 >= total} onClick={() => void run(() => loadProducts(store, offset + 20))}>{t("next")}</button></div></section> : <section>{productTab==="details"&&<><div className="wp-details-heading"><h3>{u("details")}</h3>{product.status==="active"&&button("edit",()=>void openEditor("product"))}</div><dl className="wp-facts">{productFields.map(key=><div key={key}><dt>{t(key)}</dt><dd>{key==="category"?(productCategories.find(c=>c.code===product.category)?.labels[locale]??product.category):["condition","price_negotiable"].includes(key)?t(String(product[key]??"unspecified")):String(product[key]??"—")}</dd></div>)}</dl></>}{product.status === "active" && <>{productTab==="photos"&&<><h3>{t("photos")}</h3><p>{t("photoHint")}</p><label>{t("upload")}<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => void files(event.target.files)} /></label><div className="wz-grid">{product.photos?.map(photo => <article className="wz-card" key={photo.photo_ref}>{/* Hosted URLs come only from the protected backend. */}<Image unoptimized src={photo.url} alt={product.name} width="220" height="180" /><div className="wz-actions">{["cover", "earlier", "later", "remove"].map(action => <button key={action} disabled={busy} onClick={() => void run(async () => setProduct(await send(`${productPath}/photos`, "POST", { expected_revision: product.revision, action, photo_ref: photo.photo_ref }) as Item))}>{t(action)}</button>)}</div><label>{t("replace")}<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void files(event.target.files, photo.photo_ref)} /></label></article>)}</div>
      </>}{productTab==="options"&&<><h3>{e.stock}</h3>{!product.variant_type?stockForm():product.variants?.filter(v=>v.is_available==="yes").map(v=><article key={v.public_ref}><h4>{v.label}</h4>{stockForm(v)}</article>)}</>}</>}</section>)}
    </>}
    {store&&product&&productTab==="labels"&&<WenzePOS key={product.public_ref} store={store} locale={locale} labelsOnly labelProductRef={product.public_ref}/>}
    {store&&shopTab==="settings"&&<WenzePaymentPreferences key={store.public_ref} path={storePath} locale={locale} request={request} onRevision={revision=>setStore(old=>old?{...old,revision}:null)}/>}
    {plan && <section className="wz-account-access"><h2>{d("accountAccess")}</h2>{plan.source==="personal_pilot"?<p>{d("testingAccess")}</p>:<p>{t(plan.plan)}{plan.expires_at&&` · ${t("expires")}: ${new Date(plan.expires_at).toLocaleDateString(locale)}`}</p>}<label>{t("products")} · {plan.active_products} / {plan.active_product_limit}<progress max={plan.active_product_limit} value={plan.active_products}/></label>{plan.plan==="free"&&<p>{t("allowance")}: {plan.free_import_used} / {plan.free_import_allowance}</p>}</section>}
    {preview&&<WenzeProductShare locale={locale} data={preview} visible={store?.status==="active"&&store?.visible==="true"&&(!product||(product.status==="active"&&product.visible==="true"))} onClose={()=>setPreview(null)}/>}
    {editor&&["quick","detailed"].includes(editor.kind)&&<WenzeProductWizard key={editor.draft_ref} locale={locale} busy={busy} validPhotos={!!editor.uploads?.length} validChoices={!editor.fields.variant_type||!choiceError(editor.allocations??[])} blocked={editor.stale} feedback={<>{error&&<p role="alert">{t(error)}</p>}{editor.stale&&<label><input type="checkbox" onChange={event=>setEditor(old=>old?{...old,stale:!event.target.checked}:null)}/>{t("confirmFresh")}</label>}</>} onSave={save} onCancel={()=>void leaveWork().then(ok=>{if(ok)setEditor(null);})}
      basic={<><h3>{pc("basic")}</h3><div className="wz-fields">{input("name",undefined,true)}{input("price",undefined,true)}{input("currency",currencies,true)}{categoryFields()}</div><details className="wp-optional"><summary>{pc("optional")}</summary><WenzeCategoryGuidance category={editor.fields.category??""} locale={locale}/><div className="wz-fields">{input("condition",["new","like_new","used","other","unspecified"])}{input("price_negotiable",["no","yes"])}{input("description")}</div>{costAllowed&&<section className="wz-purchase-cost"><label>{improvements.purchase}<input inputMode="decimal" pattern="[0-9]{1,12}([.,][0-9]{1,2})?" value={editor.fields.purchase_price??""} onChange={event=>change("purchase_price",event.target.value)}/></label><p>{improvements.privacy}</p><p>{improvements.before}</p>{editor.fields.variant_type&&<p>{improvements.variants}</p>}<output aria-live="polite">{(()=>{const margin=productMargin(editor.fields.price,editor.fields.purchase_price??"");return margin?<><strong>{improvements.margin}: {new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(margin.amount)} {editor.fields.currency}</strong><p>{improvements.percent}: {margin.percent===null?'—':new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(margin.percent)+'%'}</p></>:improvements.missing;})()}</output></section>}</details></>}
      photos={<WenzeDraftPhotos locale={locale} refs={editor.uploads??[]} previews={uploadPreviews} busy={busy} onFiles={list=>void files(list)} onChange={refs=>{setEditorDirty(true);setEditor({...editor,uploads:refs});}}/>}
      variations={<><h3>{pc("variations")}</h3>{!editor.fields.variant_type&&<><p>{pc("simpleHelp")}</p>{input("available_quantity")}</>}<WenzeChoiceEditor optional locale={locale} category={editor.fields.category??""} rows={editor.allocations??[]} onChange={(rows,kind)=>{setEditorDirty(true);setEditor(old=>old?{...old,kind:"detailed",allocations:rows,fields:{...old.fields,variant_type:rows.length?(kind??old.fields.variant_type??"option"):""}}:old);}}/></>}
      review={<><h3>{pc("review")}</h3><p>{pc("reviewHelp")}</p>{editor.uploads?.[0]&&uploadPreviews[editor.uploads[0]]&&<Image unoptimized src={uploadPreviews[editor.uploads[0]]} alt={editor.fields.name} width={150} height={150}/>}<dl className="wp-facts">{["name","price","currency","category","condition","price_negotiable","description"].map(key=><div key={key}><dt>{t(key)}</dt><dd>{key==="category"?(productCategories.find(c=>c.code===editor.fields.category)?.labels[locale]??editor.fields.category):["condition","price_negotiable"].includes(key)?t(editor.fields[key]):editor.fields[key]||"—"}</dd></div>)}<div><dt>{t("available")}</dt><dd>{editor.fields.variant_type?e.multiple:editor.fields.available_quantity||t("untracked")}</dd></div></dl>{editor.allocations?.map((row,index)=><p key={index}>{row.label} · {row.quantity===""?t("untracked"):row.quantity}</p>)}</>}/>}
    {editor && !["quick","detailed"].includes(editor.kind) && <section className="wz-editor"><h2 ref={editorHeading} tabIndex={-1} style={{scrollMarginTop:100}}>{editor.kind==="conversion"?e.choices:editor.kind==="product"?e.edit:t(editor.kind === "createStore" ? "create" : editor.kind === "store" || editor.kind === "product" ? "edit" : editor.kind)}</h2>{editor.latest && <aside><h3>{t("current")}</h3><p>{editor.latest.name} · {editor.latest.price} {editor.latest.currency}</p><p>{editor.latest.description}</p></aside>}{editor.stale && <label><input type="checkbox" onChange={event => setEditor(old => old ? { ...old, stale: !event.target.checked } : null)} />{t("confirmFresh")}</label>}<form id={editorFormId} onChange={()=>setEditorDirty(true)} onSubmit={save}><div className="wz-fields">
      {editor.kind === "createStore" && [input("name", undefined, true), input("category"), input("city", undefined, true), input("description")]}
      {editor.kind === "store" && shopFields.map(key => input(key, key === "store_type" ? ["online_only", "online_and_physical"] : undefined, ["name", "city"].includes(key)))}
      {["product", "duplicate"].includes(editor.kind) && <>{input("name", undefined, true)}{input("price", undefined, true)}{input("currency", currencies, true)}</>}
      {editor.kind==="product"&&categoryFields()}
      {editor.kind==="product" && <><WenzeCategoryGuidance category={editor.fields.category ?? ""} locale={locale}/>{input("condition", ["new", "like_new", "used", "other", "unspecified"])}{input("description")}{input("price_negotiable", ["no", "yes"])}</>}
      {editor.kind === "fulfillment" && <><fieldset className="ws-modes"><legend>{t("fulfillment")}</legend>{["pickup_and_delivery","pickup","delivery"].map(mode=><label key={mode}><input type="radio" name="fulfillment_mode" required checked={editor.fields.fulfillment_mode===mode} onChange={()=>change("fulfillment_mode",mode)}/>{t(mode)}</label>)}</fieldset><h3>{sc("timing")}</h3><p>{t("estimateHint")}</p>{input("preparation_estimate")}{editor.fields.fulfillment_mode !== "pickup" && input("delivery_estimate")}<h3>{sc("location")}</h3>{["area", "commune", "quartier"].map(key => input(key))}{editor.fields.fulfillment_mode !== "delivery" && <><p>{t("publicWarning")}</p>{input("address", undefined, true)}{input("landmark")}<label><input type="checkbox" required checked={editor.fields.consent === "yes"} onChange={event => change("consent", event.target.checked ? "yes" : "no")} />{t("consent")}</label></>}{editor.fields.fulfillment_mode !== "pickup" && <><h3>{sc("fees")}</h3>{input("delivery_fee_type", ["free", "fixed"], true)}{editor.fields.delivery_fee_type === "fixed" && <>{input("delivery_fee", undefined, true)}{input("delivery_currency", currencies, true)}</>}{input("delivery_areas")}</>}</>}
      {editor.kind === "duplicate" && input("stock_policy", ["zero", "untracked", "copy_available"], true)}
      {editor.kind === "conversion" && input("mode", ["single", "variants"], true)}
      {(editor.kind === "detailed" || editor.kind === "conversion") && <>{(editor.fields.mode==="single"||(editor.kind==="detailed"&&!editor.fields.variant_type))&&input("available_quantity")}{(editor.kind === "detailed" || editor.fields.mode === "variants") && <WenzeChoiceEditor locale={locale} category={editor.fields.category??product?.category??""} rows={editor.allocations??[]} available={editor.kind==="conversion"?editor.review?.available_stock:undefined} onChange={(rows,kind)=>{setEditorDirty(true);setEditor(old=>old?{...old,allocations:rows,fields:{...old.fields,variant_type:rows.length?(kind??old.fields.variant_type??"option"):""}}:old);}}/>}</>}
    </div><div className="wz-actions wz-save-bar"><span role="status">{busy?u("saving"):editorDirty?u("unsaved"):notice}</span><button disabled={busy || editor.stale || ((editor.kind==="conversion"&&editor.fields.mode==="variants"||editor.kind==="detailed"&&!!editor.fields.variant_type)&&!!choiceError(editor.allocations??[],editor.kind==="conversion"?editor.review?.available_stock:undefined)) || (["quick", "detailed"].includes(editor.kind) && !editor.uploads?.length)}>{t(editor.review ? "confirm" : "save")}</button>{button("cancel", async () => {if(await leaveWork()){setEditor(null);setEditorDirty(false);}})}</div></form></section>}
    {product&&shopTab==="products"&&productTab==="details"&&(!editor||editor.kind==="product")&&product.status==="active"&&<section className="wz-product-choices"><h3>{e.choices}</h3><p>{e.choicesHelp}</p><p>{e.oneAxis}</p>{editorDirty&&<div className="wz-actions"><p role="status">{e.saveFirst}</p><button type="submit" form={editorFormId} data-continue="choices" disabled={busy||editor?.stale}>{e.saveContinue}</button></div>}
      <fieldset disabled={busy||editorDirty}><legend>{e.choices}</legend>{!product.variant_type?<button onClick={()=>void run(()=>openEditor("conversion"))}>{e.addChoices}</button>:<>
      {product.variants?.map(variant=><article key={`${variant.public_ref}-${product.revision}`}><form className="wz-inline" onChange={()=>setProductDirty(true)} onSubmit={event=>{event.preventDefault();void variantAction("rename",variant,String(new FormData(event.currentTarget).get("label")));}}><label>{e.choice}<input name="label" required defaultValue={variant.label}/></label><button>{t("save")}</button>{button(variant.is_available==="yes"?"archive":"reactivate",()=>void variantAction(variant.is_available==="yes"?"archive":"reactivate",variant))}</form>{variant.is_available==="yes"&&stockForm(variant)}</article>)}
      <form key={product.revision} className="wz-inline" onChange={()=>setProductDirty(true)} onSubmit={event=>{event.preventDefault();void variantAction("add",undefined,String(new FormData(event.currentTarget).get("label")));}}><label>{e.choice}<input name="label" required placeholder={variantExample(product.variant_type)}/></label><button>{e.addChoice}</button></form>
      <details><summary>{e.more}</summary><button onClick={()=>void run(()=>openEditor("conversion"))}>{e.removeChoices}</button></details></>}</fieldset></section>}
  </>}</div></div></main>;
}
