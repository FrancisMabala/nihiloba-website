import {describe,it,expect} from 'vitest';
import {personalArticlesPath} from '../app/lib/personal-articles-path';
describe('legacy personal selling destination',()=>{
 for(const locale of ['en','fr','ln','sw'] as const)it(`preserves article context in ${locale}`,()=>{
  const url=new URL(personalArticlesPath(locale,{item:'WFW_draft',article_status:'drafts',article_page:'2',returnTo:'https://example.test',view:'manage'}),'https://nihiloba.com');
  expect(url.pathname).toBe((locale==='en'?'':'/'+locale)+'/shida/space');expect(Object.fromEntries(url.searchParams)).toEqual({view:'listings',tab:'article',item:'WFW_draft',article_status:'drafts',article_page:'2'});
 });
 it('does not copy ambiguous query arrays or arbitrary parameters',()=>{expect(personalArticlesPath('fr',{item:['one','two'],store:'other-shop'})).toBe('/fr/shida/space?view=listings&tab=article');});
});
