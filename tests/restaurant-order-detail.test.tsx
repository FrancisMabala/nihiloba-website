import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {RestaurantOrderDetail} from '../app/components/shida/restaurant-order-detail';
import {ThermalReceipt,type CustomerReceipt} from '../app/components/shida/restaurant-thermal-receipt';
import {receiptCopy} from '../app/lib/restaurant-receipt-copy';
import {checkoutCopy} from '../app/lib/restaurant-checkout-copy';
import {orderEvidenceCopy} from '../app/lib/order-detail-copy';
import type {Order} from '../app/lib/restaurant-work';

const order:Order={order_ref:'ROD_TEST',revision:1,state:'accepted',entry_source:'customer',fulfillment_method:'pickup',submitted_at:'2026-10-01T10:00:00Z',cancellation_pending:false,order_total:'1000',currency:'CDF'};
const receipt:CustomerReceipt={number:'ROD_TEST',restaurant:'Test restaurant',date:order.submitted_at,currency:'CDF',total:'1000',paid:false,standalone:[{name:'Rice',quantity:1,subtotal:'1000'}],plates:[],payments:[],url:null,food_subtotal:'1000',delivery_fee:null};

it.each(['en','fr','ln','sw'] as const)('does not infer payment from completed delivery: %s',locale=>{
 const html=renderToStaticMarkup(<RestaurantOrderDetail order={{...order,state:'completed',fulfillment_method:'delivery',customer_receipt:receipt}} locale={locale} receiptHref="/receipt/ROD_TEST"/>);
 expect(html).toContain(receiptCopy[locale].due);
 expect(html).not.toContain(orderEvidenceCopy[locale].recorded);
 expect(html).toContain('href="/receipt/ROD_TEST"');
});

it.each(['en','fr','ln','sw'] as const)('keeps an accepted order receipt accessible without claiming payment or handoff: %s',locale=>{
 const html=renderToStaticMarkup(<RestaurantOrderDetail order={order} locale={locale} receiptHref="/receipt/ROD_TEST"/>);
 expect(html).toContain('href="/receipt/ROD_TEST"');
 expect(html).toContain(checkoutCopy[locale].payment);
 expect(html).toContain('1000');
 expect(html).not.toContain('disabled');
 expect(html).not.toContain('2026-10-01T10:10');
});

it.each(['en','fr','ln','sw'] as const)('preserves the receipt when its QR link is missing: %s',locale=>{
 const html=renderToStaticMarkup(<ThermalReceipt value={receipt} locale={locale}/>);
 expect(html).toContain('Rice');
 expect(html).toContain('ROD_TEST');
 expect(html).toContain(receiptCopy[locale].qrUnavailable);
 expect(html).toContain(receiptCopy[locale].commercial);
 expect(html).not.toContain(receiptCopy[locale].unavailable);
 expect(html).toContain(receiptCopy[locale].due);
});
