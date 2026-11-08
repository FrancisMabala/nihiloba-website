import type {ReactNode} from 'react';
import {OrderDetailLayout} from './order-detail-layout';
import {FoodTerms} from './restaurant-receipt';
import {checkoutCopy} from '../../lib/restaurant-checkout-copy';
import {workText} from '../../lib/restaurant-work-copy';
import {dateText,type Order} from '../../lib/restaurant-work';
import type {RestaurantLocale} from '../../services/shida/restaurants-client';
import {receiptCopy} from '../../lib/restaurant-receipt-copy';
import {orderDetailCopy,orderEvidenceCopy} from '../../lib/order-detail-copy';

export function RestaurantOrderDetail({order,locale,receiptHref,children}:{order:Order;locale:RestaurantLocale;receiptHref:string;children?:ReactNode}){
 const t=checkoutCopy[locale];
 const labels=orderDetailCopy[locale], evidence=orderEvidenceCopy[locale];
 const zone=order.receipt_terms?.timezone_name??'UTC';
 return <OrderDetailLayout name={order.receipt_terms?.establishment_name||labels.restaurant} reference={order.order_ref} status={workText(locale,order.state)} date={dateText(order.submitted_at,locale,zone)}
  progress={<section><h2>{labels.tracking}</h2><ol className="shida-order-timeline"><li><strong>{t.ordered}</strong><time>{dateText(order.submitted_at,locale,zone)}</time></li><li aria-current="step"><strong>{t.current}: {workText(locale,order.state)}</strong></li></ol><p className="shida-order-note">{evidence.history}</p>{order.cancellation_pending&&<p role="status">{evidence.pending}</p>}</section>}
  documents={<section><h2>{labels.documents}</h2><a href={receiptHref}>{t.receipt} →</a><p>{t.notPaid}</p></section>}
  summary={<section><h2>{labels.summary}</h2>{order.receipt_terms?<FoodTerms terms={order.receipt_terms} locale={locale}/>:<p>{t.total}: {order.order_total??'—'} {order.currency}</p>}</section>}>
   <section><h2>{labels.payment}</h2><p className="shida-order-payment-status">{order.customer_receipt?(order.customer_receipt.paid?evidence.recorded:receiptCopy[locale].due):evidence.unknown}</p><p>{t.payment}</p><p>{workText(locale,order.fulfillment_method)}</p>{children}</section>
 </OrderDetailLayout>;
}
