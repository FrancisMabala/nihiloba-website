import type {WenzeLocale} from './wenze-copy';
/** Preserve article/draft references from old shared links; never accept an external return URL. */
export function personalArticlesPath(locale:WenzeLocale,query:Record<string,string|string[]|undefined>={}){
 const params=new URLSearchParams({view:'listings',tab:'article'});
 for(const key of ['item','article_status','article_page']){const value=query[key];if(typeof value==='string')params.set(key,value);}
 return `${locale==='en'?'':`/${locale}`}/shida/space?${params}`;
}
