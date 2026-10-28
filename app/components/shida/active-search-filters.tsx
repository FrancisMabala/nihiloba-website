import Link from 'next/link';
import type {MarketplaceLocale} from './marketplace-account-copy';

const copy={en:{active:'Active filters',remove:'Remove',clear:'Clear filters'},fr:{active:'Filtres actifs',remove:'Retirer',clear:'Effacer les filtres'},ln:{active:'Baponami ya sikoyo',remove:'Longola',clear:'Longola baponami'},sw:{active:'Vichujio vilivyowekwa',remove:'Ondoa',clear:'Ondoa vichujio'}};

/** Keep category-specific labels and query semantics in each collection. */
export function ActiveSearchFilters({locale,path,query,labels,values={}}:{
 locale:MarketplaceLocale;path:string;query:string;labels:Record<string,string>;values?:Record<string,Record<string,string>>;
}) {
 const params=new URLSearchParams(query.replace(/^\?/,'')),t=copy[locale];
 const entries=Object.entries(labels).filter(([key])=>Boolean(params.get(key)));
 if(!entries.length)return null;
 function href(remove:string[]) {
  const next=new URLSearchParams(params);
  for(const key of [...remove,'page','cursor'])next.delete(key);
  return path+(next.size?`?${next}`:'');
 }
 return <nav className="mp-active-filters" aria-label={t.active}>
  {entries.map(([key,label])=>{const value=params.get(key)!;const text=`${label}: ${values[key]?.[value]??value}`;
   return <Link key={key} href={href([key])} aria-label={`${t.remove} ${text}`}>{text}<span aria-hidden="true"> ×</span></Link>;
  })}
  <Link className="mp-clear-filters" href={href(Object.keys(labels))}>{t.clear}</Link>
 </nav>;
}
