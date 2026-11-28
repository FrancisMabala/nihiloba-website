import {describe,expect,it,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {QuickListingCard} from '../app/components/shida/quick-listing-card';
import {articleListingState,matchesArticleFilter,readArticleFilter} from '../app/lib/quick-sell-listing';
import {articleListingCopy} from '../app/lib/wenze-listings-copy';

const active={status:'active',visible:'true',available_stock:1,quick_sell_state:'available',photos:[{url:'https://example.test/image.jpg'}]};

describe('individual article states',()=>{
 it('keeps hidden publication and pending commercial activity distinct',()=>{
  const item={...active,visible:'false',quick_sell_state:'pending',available_stock:0};
  expect(articleListingState(item)).toMatchObject({online:false,hidden:true,pending:true,sold:false,mayShow:true,mayMarkSold:false});
  expect(matchesArticleFilter(item,'unpublished')).toBe(true);
  expect(matchesArticleFilter(item,'pending')).toBe(true);
  expect(matchesArticleFilter(item,'available')).toBe(false);
 });
 it.each(['seller_reported','shida_completed'] as const)('requires known %s provenance for sold',sale_provenance=>{
  const item={...active,available_stock:0,sale_provenance};
  expect(matchesArticleFilter(item,'sold')).toBe(true);
  expect(articleListingState({...item,visible:false}).mayShow).toBe(false);
 });
 it('does not offer to republish without a photo',()=>{
  expect(articleListingState({...active,visible:false,photos:[]}).mayShow).toBe(false);
 });
 it('does not label unknown stock as unavailable',()=>{
  expect(articleListingState({...active,available_stock:null}).unavailable).toBe(false);
 });
 it('keeps zero stock without provenance out of sold',()=>{
  const item={...active,available_stock:0,quick_sell_state:'sold',visible:false};
  expect(matchesArticleFilter(item,'sold')).toBe(false);
  expect(matchesArticleFilter(item,'unavailable')).toBe(true);
  expect(articleListingState(item)).toMatchObject({mayShow:false,mayMarkSold:false});
 });
 it.each(['archived','deleted'])('keeps %s history separate from hidden and disallows active actions',status=>{
  const item={...active,status,visible:false};
  expect(matchesArticleFilter(item,'archived')).toBe(true);
  expect(matchesArticleFilter(item,'unpublished')).toBe(false);
  expect(articleListingState(item)).toMatchObject({mayShow:false,mayMarkSold:false});
 });
 it('keeps existing URL filter values and handles invalid values',()=>{
  expect(readArticleFilter('unpublished')).toBe('unpublished');
  expect(readArticleFilter('pending')).toBe('pending');
  expect(readArticleFilter('invalid')).toBe('all');
 });
 it('renders independent pending and hidden badges and the primary management action',()=>{
  const item={...active,visible:false,available_stock:0,quick_sell_state:'pending',name:'Article synthétique',price:'50',currency:'USD',condition:'used'};
  const html=renderToStaticMarkup(createElement(QuickListingCard,{item,locale:'fr',location:'Kinshasa',href:'/fr/shida/wenze/produits/WNP_TEST',onManage:vi.fn(),busy:false,onAction:vi.fn(),onPhotos:vi.fn()}));
  expect(html).toContain('Masqué');
  expect(html).toContain('Transactions en cours');
  expect(html).toContain('Gérer');
  expect(html).toContain('aria-haspopup="dialog"');
  expect(html).not.toMatch(/Prochaine action|Vendues \/ indisponibles|Réservé/);
 });
 it.each(['en','fr','ln','sw'] as const)('includes the article UI labels in %s',locale=>{
  expect(Object.keys(articleListingCopy[locale])).toEqual(Object.keys(articleListingCopy.en));
  expect(Object.values(articleListingCopy[locale]).every(label=>label.trim().length>0)).toBe(true);
 });
});
