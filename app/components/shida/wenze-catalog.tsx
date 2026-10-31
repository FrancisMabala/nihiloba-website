import {WenzeSellingInvitations} from "./wenze-selling-invitations";
import {ActiveSearchFilters} from './active-search-filters';
import {marketplaceDiscoveryCopy} from "../../lib/marketplace-discovery-copy";
import { MarketplaceDiscoveryHeader } from "./public-marketplace";
import { MarketplaceSectionBreadcrumb } from "./marketplace-primitives";
import productCategories from "../../lib/wenze-product-categories.json";
import Link from "next/link";
import type { ServiceLocale as Locale } from "../../lib/services-i18n";
import { parseWenzeDiscovery, wenzeDiscoveryQuery } from "../../lib/wenze-discovery";
import { getWenzeProducts } from "../../services/shida/public-client";
import { marketplacePath } from "./marketplace";
import { ProductCard } from "./wenze";
import { WenzeBuyerProvider } from "./wenze-buyer";


export async function WenzeCatalog({locale,raw,landing=false}:{
  locale:Locale;raw:Record<string,string|string[]|undefined>;landing?:boolean;
}) {
  const t=marketplaceDiscoveryCopy[locale],search=parseWenzeDiscovery(raw);
  const categories=Object.fromEntries(productCategories.map(row=>[row.code,row.labels[locale]]));
  const root=marketplacePath(locale,landing?"/shida/wenze":"/shida/wenze/catalog");
  let data;try{data=await getWenzeProducts(search);}catch{}
  const select=(name:keyof typeof search,title:string,options:Record<string,string>)=><label><span>{title}</span><select name={name} defaultValue={search[name]||""}><option value="">{name==="availability"?t.available:t.all}</option>{Object.entries(options).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label>;
  return <WenzeBuyerProvider locale={locale}><div className="marketplace-public"><div className="wenze-public container wzp-discovery">
    <MarketplaceSectionBreadcrumb locale={locale} current="Wenze"/>
    <MarketplaceDiscoveryHeader title="Wenze" intro={t.productIntro}/>
    <nav className="mp-chips" aria-label="Wenze"><Link href={root} aria-current="page">{t.products}</Link><Link href={marketplacePath(locale,"/shida/wenze")+"?view=shops"}>{t.shops}</Link><Link href={marketplacePath(locale,"/shida/wenze/orders")}>{t.orders}</Link></nav>
    <form className="marketplace-filters wzp-filters mp-search">
      {search.store&&<input type="hidden" name="store" value={search.store}/>}
      <div className="mp-search-primary">
        <label><span>{t.productSearch}</span><input name="query" type="search" defaultValue={search.query}/></label>
        <label><span>{t.city}</span><input name="city" defaultValue={search.city}/></label>
        <button className="button button-primary">{t.search}</button>
      </div>
      {search.category&&<input type="hidden" name="category" value={search.category}/>}
      <details>
        <summary>{t.filters}</summary>
        <p>{t.priceHelp}</p>
        <div className="marketplace-filter-grid">
        {select("condition",t.condition,{new:t.new,like_new:t.like_new,used:t.used,other:t.other})}

          {select("currency",t.currency,{CDF:"CDF",USD:"USD"})}
          <label><span>{t.min}</span><input name="min_price" type="number" min="0" step="0.01" defaultValue={search.min_price}/></label>
          <label><span>{t.max}</span><input name="max_price" type="number" min="0" step="0.01" defaultValue={search.max_price}/></label>
          {select("availability",t.availability,{available:t.available,in_stock:t.in_stock,sold_out:t.sold_out})}
          {select("variant_type",t.variant,{size:t.size,shoe_size:t.shoe_size,storage:t.storage,volume:t.volume,option:t.other})}
          <label><span>{t.option}</span><input name="variant_option" maxLength={80} placeholder="M, 42, 128 GB…" defaultValue={search.variant_option}/></label>
          <label><span>{t.area}</span><input name="area" defaultValue={search.area}/></label>
        </div>
        <button className="button button-secondary" type="submit">{t.search}</button>
      </details>
    </form>
    <ActiveSearchFilters locale={locale} path={root} query={wenzeDiscoveryQuery(search)} labels={{query:t.productSearch,city:t.city,category:t.category,condition:t.condition,currency:t.currency,min_price:t.min,max_price:t.max,availability:t.availability,variant_type:t.variant,variant_option:t.option,area:t.area}} values={{category:categories,condition:{new:t.new,like_new:t.like_new,used:t.used,other:t.other},availability:{available:t.available,in_stock:t.in_stock,sold_out:t.sold_out},variant_type:{size:t.size,shoe_size:t.shoe_size,storage:t.storage,volume:t.volume,option:t.other}}}/>
    <nav className="mp-chips" aria-label={t.category}>{["",...productCategories.map(row=>row.code)].map(category=><Link key={category} href={`${root}?${wenzeDiscoveryQuery({...search,category:category||undefined},null)}`} aria-current={(search.category||"")===category?"page":undefined}>{category?categories[category]:(t.all)}</Link>)}</nav>
    {!data?<p role="alert">{t.failed}</p>:data.items.length?<div className="marketplace-grid wenze-product-grid">{data.items.map(p=><ProductCard key={p.public_ref} p={p} l={locale}/>)}</div>:<p>{t.empty}</p>}
    <nav className="wzp-discovery-actions" aria-label={t.products}>
      {search.cursor&&<Link href={`${root}?${wenzeDiscoveryQuery(search,null)}`}>{t.first}</Link>}
      {data?.next_cursor&&<Link className="button button-secondary" href={`${root}?${wenzeDiscoveryQuery(search,data.next_cursor)}`}>{t.next} →</Link>}
    </nav>
    <WenzeSellingInvitations locale={locale}/>
  </div></div></WenzeBuyerProvider>;
}
