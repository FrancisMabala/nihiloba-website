import React from 'react';
import {ShopIcon} from './wenze-shop-icons';
import type {WenzeLocale} from '../../lib/wenze-copy';
import {shopText} from '../../lib/wenze-shop-copy';
export function WenzeShopTrust({status,locale}:{status:unknown;locale:WenzeLocale}){
 const suspended=status==='suspended',t=(key:string)=>shopText(locale,key);
 return <section className={`ws-trust ${suspended?'ws-restricted':''}`} aria-label={t('trust')}><h3><ShopIcon name="shield"/>{t('trust')}</h3><strong>{t(suspended?'suspended':'commitment')}</strong><p>{t(suspended?'restriction':'policyHelp')}</p><a href={locale==='en'?'/en/acceptable-use':'/fr/utilisation-acceptable'}>{t('policy')} →</a></section>;
}
