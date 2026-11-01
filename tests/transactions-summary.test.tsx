import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {TransactionSummary} from '../app/components/shida/personal-transactions';
import {transactionText} from '../app/lib/transactions-copy';
it.each(['en','fr','ln','sw'] as const)('renders authoritative counts and localized category controls: %s',locale=>{
 const html=renderToStaticMarkup(<TransactionSummary locale={locale} category="requests" counts={{all:48,orders:31,requests:12,documents:5}} onSelect={()=>{}}/>);
 for(const count of [31,12,5])expect(html).toContain(`<strong>${count}</strong>`);
 for(const category of ['orders','requests','documents'] as const){expect(html).toContain(`tx-summary-${category}`);expect(html).toContain(transactionText(locale,category).replaceAll('&','&amp;'));}
 expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
 expect(html).not.toContain('disabled=""');
});
it('does not render a zero or enable category navigation before data arrives',()=>{
 const html=renderToStaticMarkup(<TransactionSummary locale="en" category="all" onSelect={()=>{}}/>);
 expect(html.match(/<strong>—<\/strong>/g)).toHaveLength(3);
 expect(html.match(/disabled=""/g)).toHaveLength(3);
});
