import Link from "next/link";
import type { Locale } from "../../lib/i18n";
import { parseWenzeDiscovery, wenzeDiscoveryQuery } from "../../lib/wenze-discovery";
import { getWenzeProducts } from "../../services/shida/public-client";
import { marketplacePath } from "./marketplace";
import { ProductCard } from "./wenze";
import { WenzeBuyerProvider } from "./wenze-buyer";

const categories = {
  fashion_clothing:["Clothing","Vêtements"],shoes_accessories:["Shoes & accessories","Chaussures et accessoires"],
  phones_electronics:["Electronics","Électronique"],beauty_cosmetics:["Beauty","Beauté"],
  food_drinks:["Food & drinks","Alimentation"],home_equipment:["Home equipment","Équipement maison"],
  furniture_decor:["Furniture & decor","Meubles et décoration"],hardware_diy:["Hardware & DIY","Bricolage"],
  auto_moto_parts:["Auto & motorbike parts","Pièces auto et moto"],baby_children:["Baby & children","Bébé et enfants"],
  books_school_office:["Books & office","Livres et bureau"],sports_leisure:["Sports & leisure","Sport et loisirs"],
  health_hygiene:["Health & hygiene","Santé et hygiène"],other:["Other","Autre"],
};
export async function WenzeCatalog({locale,raw}:{
  locale:Locale;raw:Record<string,string|string[]|undefined>;
}) {
  const fr=locale==="fr",i=fr?1:0,search=parseWenzeDiscovery(raw);
  const root=marketplacePath(locale,"/shida/wenze/catalog");
  let data;try{data=await getWenzeProducts(search);}catch{}
  const select=(name:keyof typeof search,title:string,options:Record<string,string[]>)=><label><span>{title}</span><select name={name} defaultValue={search[name]||""}><option value="">{name==="availability"?(fr?"Disponible à commander":"Available to order"):(fr?"Tous":"All")}</option>{Object.entries(options).map(([key,value])=><option key={key} value={key}>{value[i]}</option>)}</select></label>;
  return <WenzeBuyerProvider locale={locale}><div className="wenze-public container wzp-discovery">
    <Link href={marketplacePath(locale,"/shida/wenze")}>← {fr?"Les boutiques":"Browse shops"}</Link>
    <h1>{fr?"Trouvez votre prochain coup de cœur":"Find your next favourite"}</h1>
    <form className="marketplace-filters wzp-filters">
      {search.store&&<input type="hidden" name="store" value={search.store}/>}
      <div className="marketplace-filter-grid">
        <label><span>{fr?"Rechercher un produit":"Search products"}</span><input name="query" type="search" defaultValue={search.query}/></label>
        {select("category",fr?"Catégorie":"Category",categories)}
        {select("condition",fr?"État":"Condition",{new:["New","Neuf"],like_new:["Like new","Comme neuf"],used:["Used","D’occasion"],other:["Other condition","Autre état"]})}
      </div>
      <details>
        <summary>{fr?"Prix, disponibilité et options":"Price, availability and options"}</summary>
        <p>{fr?"Choisissez une devise pour filtrer les prix. Les options correspondent aux tailles ou configurations indiquées par le vendeur.":"Choose a currency to filter prices. Options match the sizes or configurations entered by the seller."}</p>
        <div className="marketplace-filter-grid">
          {select("currency",fr?"Devise":"Currency",{CDF:["CDF","CDF"],USD:["USD","USD"]})}
          <label><span>{fr?"Prix minimum":"Minimum price"}</span><input name="min_price" type="number" min="0" step="0.01" defaultValue={search.min_price}/></label>
          <label><span>{fr?"Prix maximum":"Maximum price"}</span><input name="max_price" type="number" min="0" step="0.01" defaultValue={search.max_price}/></label>
          {select("availability",fr?"Disponibilité":"Availability",{available:["Available to order","Disponible à commander"],in_stock:["Known stock available","Stock disponible confirmé"],sold_out:["Sold out","Épuisé"]})}
          {select("variant_type",fr?"Type d’option":"Option type",{size:["Size","Taille"],shoe_size:["Shoe size","Pointure"],storage:["Storage","Stockage"],volume:["Volume","Volume"],option:["Other option","Autre option"]})}
          <label><span>{fr?"Option recherchée":"Option to find"}</span><input name="variant_option" maxLength={80} placeholder="M, 42, 128 GB…" defaultValue={search.variant_option}/></label>
          <label><span>{fr?"Ville":"City"}</span><input name="city" defaultValue={search.city}/></label>
          <label><span>{fr?"Quartier ou commune":"Area"}</span><input name="area" defaultValue={search.area}/></label>
        </div>
      </details>
      <div className="wzp-discovery-actions"><button className="button button-primary">{fr?"Rechercher":"Search"}</button><Link href={root+(search.store?`?store=${encodeURIComponent(search.store)}`:"")}>{fr?"Effacer les filtres":"Clear filters"}</Link></div>
    </form>
    {!data?<p role="alert">{fr?"Impossible de charger les produits. Vérifiez vos filtres : les prix nécessitent une devise et les options un type. Réessayez ensuite.":"Products could not be loaded. Check your filters: prices need a currency and options need a type. Then try again."}</p>:data.items.length?<div className="marketplace-grid wenze-product-grid">{data.items.map(p=><ProductCard key={p.public_ref} p={p} l={locale}/>)}</div>:<p>{fr?"Aucun produit ne correspond. Essayez d’élargir vos filtres.":"No matching products. Try broadening your filters."}</p>}
    <nav className="wzp-discovery-actions" aria-label={fr?"Pages de produits":"Product pages"}>
      {search.cursor&&<Link href={`${root}?${wenzeDiscoveryQuery(search,null)}`}>{fr?"Première page":"First page"}</Link>}
      {data?.next_cursor&&<Link className="button button-secondary" href={`${root}?${wenzeDiscoveryQuery(search,data.next_cursor)}`}>{fr?"Produits suivants":"Next products"} →</Link>}
    </nav>
  </div></WenzeBuyerProvider>;
}
