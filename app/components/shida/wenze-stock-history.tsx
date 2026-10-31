import {formatWenzeFact} from '@/app/lib/wenze-management-copy';
import {sellerText} from '@/app/lib/wenze-seller-copy';
import type {WenzeLocale} from '@/app/lib/wenze-copy';
const words:Record<string,string[]>={
 product:['Product','Produit','Eloko','Bidhaa'],movement:['Movement','Mouvement','Mouvement','Mwendo'],quantity:['Quantity','Quantité','Motango','Idadi'],reason:['Reason','Motif','Ntina','Sababu'],date:['Date','Date','Mokolo','Tarehe'],reference:['Reference','Référence','Nimero','Rejea'],
 added:['Stock added','Stock ajouté','Stock ebakisami','Bidhaa zimeongezwa'],removed:['Stock removed','Stock retiré','Stock elongolami','Bidhaa zimeondolewa'],unchanged:['No quantity change','Quantité inchangée','Motango ebongwani te','Idadi haijabadilika'],
 sale_issue:['Stock removed after sale','Stock retiré après vente','Stock elongolami nsima ya vente','Bidhaa zimeondolewa baada ya mauzo'],priced_physical_sale_reversal:['Sale reversal','Annulation de vente','Vente elongolami','Mauzo yamebatilishwa'],manual_opening:['Initial stock recorded','Stock initial enregistré','Stock ya liboso ekomami','Bidhaa za awali zimerekodiwa'],manual_adjustment:['Manual adjustment','Ajustement manuel','Stock ebongisami','Marekebisho ya bidhaa'],stock_count:['Stock count','Comptage du stock','Kotanga stock','Hesabu ya bidhaa'],other:['Stock movement','Mouvement de stock','Mouvement ya stock','Mwendo wa bidhaa'],
};
export function WenzeStockHistory({movements,locale,timeZone}:{movements:Record<string,unknown>[];locale:WenzeLocale;timeZone:string}){
 const index=['en','fr','ln','sw'].indexOf(locale),t=(key:string)=>words[key]?.[index]??words.other[index];
 if(!movements.length)return <p>{sellerText(locale,'empty')}</p>;
 return <div className="wz-table wp-movement-table"><table><thead><tr>{['product','movement','quantity','reason','date','reference'].map(k=><th key={k}>{t(k)}</th>)}</tr></thead><tbody>{movements.map((row,index)=>{
  const raw=row.quantity_effect??row.quantity,quantity=raw==null||raw===''?null:Number(raw),known=quantity!==null&&Number.isFinite(quantity),reason=String(row.reason??'');
  const values=[String(row.catalog_label??row.label??'—'),known?t(quantity!>0?'added':quantity!<0?'removed':'unchanged'):'—',known?`${quantity!>0?'+':''}${new Intl.NumberFormat(locale).format(quantity!)}`:'—',reason?(words[reason]?t(reason):reason.includes('_')?t('other'):reason):'—',formatWenzeFact(row.effective_at??row.recorded_at??row.created_at,'effective_at',locale,timeZone),String(row.movement_ref??'—')];
  return <tr key={String(row.movement_ref??index)}>{values.map((value,n)=><td key={n} data-label={t(['product','movement','quantity','reason','date','reference'][n])} className={n===2&&known?(quantity!>0?'wp-movement-positive':quantity!<0?'wp-movement-negative':undefined):undefined}>{value}</td>)}</tr>;
 })}</tbody></table></div>;
}
