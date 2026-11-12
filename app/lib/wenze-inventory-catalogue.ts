import type {SavedProduct, SavedOption} from './wenze-saved';

export type Balance = {item_ref:string; tracking_state?:string; catalog_ref?:string; catalog_parent_ref?:string; catalog_label?:string; label?:string; operational_code?:string; available:number|null; reserved:number|null; on_hand:number|null; unit:string; is_low_stock?:boolean};
export type StockLine = Balance & {option:string; attributes:Record<string,string>; target:string};
export type StockFilter = 'all'|'available'|'low'|'out'|'untracked'|'uninitialized';
export type InventoryProduct = ReturnType<typeof inventoryCatalogue>[number];
const sizes = ['XXS','XS','S','M','L','XL','XXL','2XL','3XL','4XL','5XL'];

/** Read every active catalogue page and stock page used by the product-level filters. */
export async function loadInventoryCatalogue(read:(path:string)=>Promise<unknown>){
  async function products(){
    const list:SavedProduct[]=[];
    do {
      const page=await read('products?status=active&offset='+list.length+'&limit=100') as {products:SavedProduct[];total:number};
      if(!page.products.length)break;
      list.push(...page.products);
      if(list.length>=page.total)break;
    }while(true);
    return list;
  }
  async function balances(){
    const list:Balance[]=[],seen=new Set<string>();
    let cursor='';
    do {
      if(seen.has(cursor))throw new Error('Repeated inventory cursor');
      seen.add(cursor);
      const page=await read('inventory/stock?limit=100'+(cursor?'&cursor='+encodeURIComponent(cursor):'')) as {items:Balance[];next_cursor?:string|null};
      list.push(...page.items);
      cursor=page.next_cursor??'';
    }while(cursor);
    return list;
  }
  const [catalogue,stock]=await Promise.all([products(),balances()]);
  return {catalogue,stock};
}

function stockLine(product:SavedProduct, option:SavedOption|undefined, balance:Balance|undefined):StockLine {
  const target=option??product;
  const available=balance?balance.available:target.available_stock??null;
  const reserved=balance?balance.reserved:target.committed_quantity??null;
  return {...balance, item_ref:balance?.item_ref??'',target:target.public_ref,option:option?.label??'',
    attributes:option?.option_attributes??{}, available,reserved,
    on_hand:balance?balance.on_hand:available===null||reserved===null?null:available+reserved,
    unit:balance?.unit??'piece'};
}

export function inventoryCatalogue(products:SavedProduct[], balances:Balance[]){
  const byTarget=new Map(balances.map(row=>[row.catalog_ref,row]));
  return products.map(product=>{
    const lines=product.variant_type?(product.variants??[]).filter(v=>v.is_available==='yes').map(v=>stockLine(product,v,byTarget.get(v.public_ref))):[stockLine(product,undefined,byTarget.get(product.public_ref))];
    lines.sort((a,b)=>{
      const left=sizes.indexOf(a.attributes.size?.toUpperCase()),right=sizes.indexOf(b.attributes.size?.toUpperCase());
      return left<0||right<0?0:left-right;
    });
    const total=(key:'on_hand'|'reserved'|'available')=>lines.length&&lines.every(l=>l[key]!==null)?lines.reduce((n,l)=>n+l[key]!,0):null;
    const available=total('available');
    const low=lines.filter(l=>l.is_low_stock&&l.available!==null&&l.available>0);
    const out=lines.filter(l=>l.available===0);
    return {product,lines,on_hand:total('on_hand'),reserved:total('reserved'),available,low,out,
      canSell:lines.some(l=>l.available!==null&&l.available>0)};
  });
}

export function matchesStock(group:InventoryProduct,filter:StockFilter){
  switch(filter){
    case 'untracked': return group.lines.some(l=>l.tracking_state==='untracked_physical');
    case 'uninitialized': return group.lines.some(l=>l.tracking_state==='tracked_uninitialized');
    case 'all': return true;
    case 'available': return group.canSell;
    case 'low': return group.low.length>0;
    case 'out': return group.out.length>0;
  }
}
