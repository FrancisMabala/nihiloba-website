"use client";
import {type ReactNode} from 'react';
import {ManagementMobileNavigation} from './management-mobile-navigation';
export function RestaurantBottomNavigation({locale,tab,disabled,items,onOpen,identity}:{identity?:ReactNode;locale:'fr'|'en'|'ln'|'sw';tab:string;sell:string;disabled:boolean;items:{key:string;label:string;active?:boolean}[];onOpen:(key:string)=>void|boolean|Promise<void|boolean>}){
 return <ManagementMobileNavigation locale={locale} current={tab} disabled={disabled} items={items} primary={['today','orders','items',items.some(item=>item.key==='daily')?'daily':'recovery']} onNavigate={onOpen} identity={identity}/>;
}
