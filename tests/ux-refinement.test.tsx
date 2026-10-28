import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {ActiveSearchFilters} from '../app/components/shida/active-search-filters';
import {marketplaceLanguagePath} from '../app/lib/marketplace-navigation';

describe('refined discovery navigation',()=>{
 it('removes one filter without losing the shop, other criteria or locale',()=>{
  const html=renderToStaticMarkup(<ActiveSearchFilters locale="fr" path="/fr/shida/wenze" query="store=WNZ_demo&city=Kinshasa&min_price=0&cursor=next" labels={{city:'Ville',min_price:'Prix minimum'}}/>);
  expect(html).toContain('Retirer Prix minimum: 0');
  expect(html).toContain('href="/fr/shida/wenze?store=WNZ_demo&amp;city=Kinshasa"');
  expect(html).toContain('href="/fr/shida/wenze?store=WNZ_demo"');
  expect(html).not.toContain('cursor=');
 });
 it('uses readable category names and removes pagination when criteria change',()=>{
  const html=renderToStaticMarkup(<ActiveSearchFilters locale="fr" path="/fr/shida/appartements" query="property_type=apartment&page=3" labels={{property_type:'Type'}} values={{property_type:{apartment:'Appartement'}}}/>);
  expect(html).toContain('Retirer Type: Appartement');expect(html).not.toContain('page=');
 });
 it.each(['en','fr','ln','sw'] as const)('keeps translated Wenze destinations in %s',locale=>{
  const prefix=locale==='en'?'':`/${locale}`;
  expect(marketplaceLanguagePath('/fr/shida/wenze/produits/shoe',locale)).toBe(`${prefix}/shida/wenze/${locale==='fr'?'produits':'products'}/shoe`);
  expect(marketplaceLanguagePath('/shida/wenze/cart',locale)).toBe(`${prefix}/shida/wenze/${locale==='en'?'cart':'panier'}`);
 });
});
