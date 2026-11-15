"use client";
import {ManagementMobileNavigation} from "./management-mobile-navigation";
import {providerCopy,type ProviderLocale,type ProviderView} from "../../lib/services-provider-copy";
import {connectedBusinessCopy} from '../../lib/connected-business-copy';
import {SellerWorkspaceNavigation,type SellerNavigationItem} from './seller-workspace';
export function ServicesProviderNavigation({locale,items,current,onNavigate}:{locale:ProviderLocale;items:ProviderView[];current:ProviderView;counterShortcut?:boolean;onNavigate:(view:ProviderView)=>void|boolean|Promise<void|boolean>}){
 const t=providerCopy[locale],c=connectedBusinessCopy[locale];
 const keys:ProviderView[]=['overview','work','calendar','available','services','counter','finance','activity'];
 const mapped=current==='proposals'?'available':['templates','reports','documents'].includes(current)?'finance':current;
 const icon:Record<string,SellerNavigationItem['icon']>={overview:'overview',work:'work',calendar:'calendar',available:'work',services:'catalog',counter:'finance',finance:'reports',activity:'profile'};
 const visible=keys.filter(key=>items.includes(key)||key==='finance'&&items.includes('templates'));
 const destinations=visible.map(key=>({key,label:key==='available'?c.find:key==='activity'?c.activity:t[key as keyof typeof t],icon:icon[key]}));
 const choose=(key:string)=>onNavigate((key==='finance'&&!items.includes('finance')?'templates':key) as ProviderView);
 return <><div className="management-desktop-navigation"><SellerWorkspaceNavigation label={t.navigation} items={destinations} current={mapped} onNavigate={choose}/></div><ManagementMobileNavigation locale={locale} items={destinations} primary={['overview','work','calendar','finance']} current={mapped} onNavigate={choose}/></>;
}
