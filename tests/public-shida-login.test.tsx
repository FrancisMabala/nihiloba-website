import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({path:'/shida/services/'}));
vi.mock('next/navigation',()=>({usePathname:()=>state.path}));
vi.mock('../app/components/shida/cart-provider',()=>({useCart:()=>({cart:null,loading:false})}));
import {Header} from '../app/components/header';
import {publicAccountCopy} from '../app/lib/public-account-copy';
beforeEach(()=>{state.path='/shida/services/';});
it.each(['/shida','/shida/services/','/shida/services/home-repair','/shida/wenze','/shida/restaurants','/shida/jobs','/shida/apartments','/shida/hotels'])('exposes sign-in before hydration on %s',path=>{
 state.path=path;const html=renderToStaticMarkup(<Header locale="en"/>);
 expect(html).toContain('Sign in to SHIDA');expect(html).toContain('aria-haspopup="dialog"');expect(html).not.toContain('candidate-login');
});
it.each(['en','fr','ln','sw'] as const)('uses the account entry language for %s',locale=>{
 state.path=`/${locale}/shida/service-bills`;const html=renderToStaticMarkup(<Header locale={locale==='en'?'en':'fr'}/>);
 expect(html).toContain(publicAccountCopy[locale].signInLabel);
});
it.each(['/en/about','/fr/education','/shidax','/en/products'])('does not add account UI to unrelated page %s',path=>{
 state.path=path;expect(renderToStaticMarkup(<Header locale="en"/>)).not.toContain('shida-account-trigger');
});
