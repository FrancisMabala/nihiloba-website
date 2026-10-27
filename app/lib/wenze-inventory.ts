import type {WenzeLocale} from './wenze-copy';
type Row=Record<string,unknown>;
export function groupStock(items:Row[],products:Row[]=[]){
 const groups=new Map<string,{key:string;name:string;items:Row[];on_hand:number|null;reserved:number|null;available:number|null}>();
 const seen=new Set<string>();
 for(const row of items){const ref=String(row.item_ref);if(seen.has(ref))continue;seen.add(ref);
  const key=String(row.catalog_parent_ref||row.catalog_ref||row.item_ref);
  let group=groups.get(key);if(!group){group={key,name:String(products.find(p=>p.public_ref===key)?.name||row.catalog_parent_label||row.catalog_label||row.label||key),items:[],on_hand:0,reserved:0,available:0};groups.set(key,group);}
  group.items.push(row);
  for(const field of ['on_hand','reserved','available'] as const){const value=row[field];group[field]=group[field]===null||value==null||!Number.isFinite(Number(value))?null:group[field]+Number(value);}
 }
 return [...groups.values()];
}
const copy={
 en:{products:'Products',results:'Products found in this view',empty:'No matching product. Check the name, code or filters.',found:'Product found',variants:'Variants',actions:'Actions'},
 fr:{products:'Produits',results:'Produits trouvés dans cette vue',empty:'Aucun produit trouvé. Vérifiez le nom, le code ou les filtres.',found:'Produit trouvé',variants:'Variantes',actions:'Actions'},
 ln:{products:'Biloko',results:'Biloko ezwami na eteni oyo',empty:'Eloko ezwami te. Tala nkombo, code to filtre.',found:'Eloko ezwami',variants:'Mitindo',actions:'Misala'},
 sw:{products:'Bidhaa',results:'Bidhaa zilizopatikana hapa',empty:'Hakuna bidhaa. Kagua jina, namba au vichujio.',found:'Bidhaa imepatikana',variants:'Aina',actions:'Vitendo'}
};
export const inventoryText=(locale:WenzeLocale)=>copy[locale];
