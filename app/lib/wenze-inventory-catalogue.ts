import type {SavedProduct, SavedOption} from './wenze-saved';

export type Balance = {item_ref:string; catalog_ref?:string; catalog_parent_ref?:string; catalog_label?:string; label?:string; operational_code?:string; available:number|null; reserved:number|null; on_hand:number|null; unit:string; is_low_stock?:boolean};
export type StockLine = Balance & {option:string; attributes:Record<string,string>; target:string};
export type StockFilter = 'all'|'available'|'low'|'out';
export type InventoryProduct = ReturnType<typeof inventoryCatalogue>[number];
const sizes = ['XXS','XS','S','M','L','XL','XXL','2XL','3XL','4XL','5XL'];

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
    case 'all': return true;
    case 'available': return group.canSell;
    case 'low': return group.low.length>0;
    case 'out': return group.out.length>0;
  }
}
