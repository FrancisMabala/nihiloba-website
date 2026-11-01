"use client";
import {useEffect,useRef,useState} from 'react';
import {RestaurantPhoto} from './restaurant-photo';
import {RestaurantPrice} from './restaurant-menu-price';
import {restaurantCopy} from '../../lib/restaurant-i18n';
import {checkoutCopy} from '../../lib/restaurant-checkout-copy';
import {guestText} from '../../lib/restaurant-guest-copy';
import {cents,decimal,displayMoney} from '../../lib/restaurant-counter-values';
import {menuAmountInput} from '../../lib/restaurant-menu-selection';
import {SpaceIcon} from './account-space-icon';
import type {GuestSelections as Selections} from '../../lib/restaurant-guest-browser';
import type {RestaurantLocale,RestaurantMenuItem} from '../../services/shida/restaurants-client';
import './restaurant-public-refinement.css';
const copy={en:{estimate:'Estimated subtotal',close:'Close',less:'Decrease quantity',more:'Increase quantity'},fr:{estimate:'Sous-total estimé',close:'Fermer',less:'Réduire la quantité',more:'Augmenter la quantité'},ln:{estimate:'Motango ya mbongo mpo na sikoyo',close:'Kanga',less:'Kitisa motango',more:'Bakisa motango'},sw:{estimate:'Jumla ya makadirio',close:'Funga',less:'Punguza idadi',more:'Ongeza idadi'}};
type Props={item:RestaurantMenuItem;locale:RestaurantLocale;selections:Selections;busy:boolean;onAdd:(plate:number|null,quantity:number,amount:string)=>void};
export function MenuChoice({item,locale,selections,busy,onAdd}:Props){
 const t=checkoutCopy[locale],r=restaurantCopy[locale],[open,setOpen]=useState(false);
 const available=item.availability==='available'&&item.pricing_model!=='UNKNOWN';
 return <article id={`item-${item.public_ref}`} className="rst-menu-card">
  <div className="rst-choice-photo">{item.image_url?<RestaurantPhoto src={item.image_url} alt={item.name||r.menu}/>:<span className="rst-food-placeholder" aria-hidden="true"><SpaceIcon name="restaurant"/></span>}</div>
  <div className="rst-choice-body"><h3>{item.name}</h3>{item.description&&<p className="rst-food-description">{item.description}</p>}<RestaurantPrice item={item} locale={locale}/>
   {available?<button type="button" data-restaurant-item-open={item.public_ref} disabled={busy} onClick={()=>setOpen(true)}>{t.add}</button>:<p className="rst-choice-state">{item.availability!=='available'?r[item.availability]:r.unknownPrice}</p>}
  </div>
  {open&&<FoodChoice item={item} locale={locale} selections={selections} busy={busy||!available} onClose={()=>setOpen(false)} onAdd={(plate,quantity,amount)=>{onAdd(plate,quantity,amount);setOpen(false);}}/>}
 </article>;
}
function FoodChoice({item,locale,selections,busy,onAdd,onClose}:Props&{onClose:()=>void}){
 const t=checkoutCopy[locale],c=copy[locale],dialog=useRef<HTMLDialogElement>(null);
 const [quantity,setQuantity]=useState(1),[amount,setAmount]=useState(item.allowed_amounts[0]??item.minimum_amount??''),[plateKey,setPlateKey]=useState('');
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null,el=dialog.current;el?.showModal();return()=>{el?.close();previous?.focus();};},[]);
 const validQuantity=Number.isSafeInteger(quantity)&&quantity>=1&&quantity<=1000;
 const selectedAmount=menuAmountInput(item,amount),validAmount=selectedAmount!==null;
 const plate=item.presentation==='component'?(plateKey?selections.plates.findIndex(p=>p.key===plateKey):-1):null;
 const validPlate=!plateKey||selections.plates.some(p=>p.key===plateKey);
 const unit=cents(item.unit_price??''),total=item.pricing_model==='UNIT_PRICED'&&unit!==null&&validQuantity?decimal(unit*BigInt(quantity)):selectedAmount;
 return <dialog data-restaurant-item-view={item.public_ref} ref={dialog} className="rst-food-dialog" aria-labelledby={`choice-${item.public_ref}`} onCancel={e=>{e.preventDefault();onClose();}}>
  <header><h2 id={`choice-${item.public_ref}`}>{item.name}</h2><button type="button" aria-label={c.close} onClick={onClose}>×</button></header>
  {item.image_url&&<div className="rst-food-dialog-photo"><RestaurantPhoto src={item.image_url} alt={item.name||restaurantCopy[locale].menu}/></div>}
  {item.description&&<p>{item.description}</p>}<RestaurantPrice item={item} locale={locale}/>
  <fieldset disabled={busy}>
   {item.presentation==='component'&&<label>{guestText(locale,'combineWith')}<select value={plateKey} onChange={e=>setPlateKey(e.target.value)}><option value="">{guestText(locale,'newPlate')}</option>{selections.plates.map((p,i)=><option key={p.key} value={p.key}>{t.plate} {i+1}</option>)}</select><small>{guestText(locale,'plateHelp')}</small></label>}
   {item.pricing_model==='UNIT_PRICED'?<label>{t.quantity}<span className="rst-food-quantity"><button type="button" aria-label={c.less} disabled={quantity<=1} onClick={()=>setQuantity(q=>Math.max(1,q-1))}>−</button><input type="number" min="1" max="1000" step="1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/><button type="button" aria-label={c.more} disabled={quantity>=1000} onClick={()=>setQuantity(q=>Math.min(1000,q+1))}>+</button></span></label>:<label>{t.amount}{item.allowed_amounts.length?<select value={amount} onChange={e=>setAmount(e.target.value)}>{item.allowed_amounts.map(value=><option key={value} value={value}>{displayMoney(value,locale)} {item.currency}</option>)}</select>:<input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/>}<small>{t.amountHelp}</small></label>}
  </fieldset>
  {total&&<p className="rst-food-subtotal"><span>{c.estimate}</span><strong>{displayMoney(total,locale)} {item.currency}</strong></p>}
  <footer><button type="button" data-restaurant-item-selection={item.public_ref} disabled={busy||!validPlate||(item.pricing_model==='UNIT_PRICED'?!validQuantity:!validAmount)} onClick={()=>onAdd(plate,quantity,selectedAmount??amount)}>{t.add}</button></footer>
 </dialog>;
}
