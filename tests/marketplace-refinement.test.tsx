import {afterEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {WenzeCatalog} from '../app/components/shida/wenze-catalog';
import {MarketplaceBreadcrumb,MarketplaceSectionBreadcrumb} from '../app/components/shida/marketplace-primitives';
import categories from '../app/lib/wenze-product-categories.json';
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn()})}));
afterEach(()=>vi.unstubAllGlobals());
it('suppresses landing breadcrumbs while preserving contextual detail links',()=>{
 expect(renderToStaticMarkup(<MarketplaceSectionBreadcrumb locale="fr" current="Services"/>)).toBe('');
 const items=[{label:'Wenze',href:'/fr/shida/wenze'},{label:'Product'}];
 expect(renderToStaticMarkup(<MarketplaceBreadcrumb context="landing" label="Navigation" items={items}/>)).toBe('');
 expect(renderToStaticMarkup(<MarketplaceBreadcrumb label="Navigation" items={items}/>)).toContain('href="/fr/shida/wenze"');
});
it('uses accurate discovery wording and keeps child categories inside the collapsed category browser',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[],count:0,has_more:false,next_cursor:null}))));
 const html=renderToStaticMarkup(await WenzeCatalog({locale:'fr',raw:{},landing:true}));
 expect(html).toContain('Teka, somba, solola prix, nyonso na Wenze!');expect(html).toContain('Découvrir les produits');expect(html).not.toContain('Produits populaires');expect(html).not.toContain('marketplace-breadcrumb');
 const categorySection=html.slice(html.indexOf('class="wz-category-browser"'));
 const primary=categorySection.slice(0,categorySection.indexOf('<details>'));
 for(const child of categories.filter(row=>row.parent))expect(primary).not.toContain(`category=${encodeURIComponent(child.code)}`);
 expect(categorySection).toContain('Voir toutes les catégories');
});
it('shows only the selected family of subcategories and retains search context',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[],count:0,has_more:false,next_cursor:null}))));
 const child=categories.find(row=>row.parent==='fashion_clothing')!;
 const html=renderToStaticMarkup(await WenzeCatalog({locale:'en',raw:{category:child.code,city:'Kinshasa',query:'shirt'},landing:true}));
 const sub=html.slice(html.indexOf('class="mp-chips wz-subcategories"')).split('</nav>')[0];
 expect(sub).toContain(`category=${encodeURIComponent(child.code)}`);expect(sub).toContain('city=Kinshasa');expect(sub).toContain('query=shirt');
 for(const other of categories.filter(row=>row.parent&&row.parent!=='fashion_clothing'))expect(sub).not.toContain(`category=${encodeURIComponent(other.code)}`);
});
