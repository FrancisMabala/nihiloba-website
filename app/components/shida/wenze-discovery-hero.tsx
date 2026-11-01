import Link from 'next/link';
import {WENZE_SLOGAN} from '../../lib/brand';
import {marketplaceDiscoveryCopy} from '../../lib/marketplace-discovery-copy';
import {marketplacePath} from './marketplace';
import {IllustratedMarketplaceHero,StorefrontIllustration} from './illustrated-marketplace-hero';
import type {ServiceLocale} from '../../lib/services-i18n';
export const wenzeRefinementCopy={
 en:{intro:'Sell, buy and discuss prices. Clothes, phones and home essentials — find them on SHIDA.',discover:'Discover products',categories:'Categories',all:'View all categories'},
 fr:{intro:'Vends, achète et discute les prix. Bilamba, téléphones, biloko ya ndako… tout se retrouve sur SHIDA.',discover:'Découvrir les produits',categories:'Catégories',all:'Voir toutes les catégories'},
 ln:{intro:'Teká, sombá mpe sololá ntalo. Bilamba, batelefone mpe biloko ya ndako… nyonso ezali na SHIDA.',discover:'Tala biloko',categories:'Mitindo',all:'Tala mitindo nyonso'},
 sw:{intro:'Uza, nunua na jadili bei. Nguo, simu na vifaa vya nyumbani… vyote kwenye SHIDA.',discover:'Gundua bidhaa',categories:'Aina',all:'Tazama aina zote'}
};
export function WenzeDiscoveryHero({locale}:{locale:ServiceLocale}){
 const t=wenzeRefinementCopy[locale];
 return <IllustratedMarketplaceHero title="Wenze" slogan={WENZE_SLOGAN} intro={t.intro} tone="shop" art={<StorefrontIllustration/>}/>;
}
export function WenzePublicTabs({locale,shops=false}:{locale:ServiceLocale;shops?:boolean}){
 const t=marketplaceDiscoveryCopy[locale],root=marketplacePath(locale,'/shida/wenze');
 return <nav className="mp-chips wz-public-tabs" aria-label="Wenze"><Link href={root} aria-current={!shops?'page':undefined}>{t.products}</Link><Link href={root+'?view=shops'} aria-current={shops?'page':undefined}>{t.shops}</Link></nav>;
}

export function WenzeLoading({locale}:{locale:ServiceLocale}){return <div className="container wz-loading" role="status" aria-label={({en:"Loading marketplace",fr:"Chargement du marché",ln:"Kozwa biloko",sw:"Inapakia soko"})[locale]}>{[0,1,2,3].map(i=><span aria-hidden="true" key={i}/>)}</div>;}
