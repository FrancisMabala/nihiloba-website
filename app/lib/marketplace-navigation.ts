import type {MarketplaceLocale} from "../components/shida/marketplace-account-copy";
// Preserve the destination while translating the few routes with localized slugs.
export function marketplaceLanguagePath(pathname:string,locale:MarketplaceLocale){
 let path=pathname.replace(/^\/(en|fr|ln|sw)(?=\/|$)/,"");
 if(locale==="en")path=path.replace(/\/panier(?=\/|$)/,"/cart");
 else path=path.replace(/\/cart(?=\/|$)/,"/panier");
 path=locale==='fr'?path.replace(/\/wenze\/products(?=\/|$)/,'/wenze/produits'):path.replace(/\/wenze\/produits(?=\/|$)/,'/wenze/products');
 return `${locale==="en"?"":`/${locale}`}${path}`;
}
