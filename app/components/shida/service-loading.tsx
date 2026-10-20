import {serviceNavigationCopy,type ServiceLocale} from "../../lib/services-i18n";

export function ServiceDetailLoading({locale}:{locale:ServiceLocale}){
 return <section className="section"><div className="container marketplace-loading" role="status" aria-live="polite" aria-busy="true"><span className="marketplace-loading-mark" aria-hidden="true"/><p>{serviceNavigationCopy[locale].loading}</p></div></section>;
}
