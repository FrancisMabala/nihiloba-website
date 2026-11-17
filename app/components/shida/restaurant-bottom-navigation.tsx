"use client";
import {type ReactNode} from 'react';
import {ManagementMobileNavigation} from './management-mobile-navigation';
export function RestaurantBottomNavigation({locale,tab,sell,disabled,items,onOpen,identity}:{identity?:ReactNode;locale:'fr'|'en'|'ln'|'sw';tab:string;sell:string;disabled:boolean;items:{key:string;label:string;active?:boolean}[];onOpen:(key:string)=>void|boolean|Promise<void|boolean>}){
 return <ManagementMobileNavigation locale={locale} current={tab} disabled={disabled} items={[...items.filter(item=>item.key==='items'),...items.filter(item=>item.key!=='items')]} primary={['today','orders',sell]} onNavigate={onOpen} identity={<div className="rst-more-identity">{identity}</div>} extra={<a className="rst-more-return" href={`${locale==='en'?'':'/'+locale}/shida/space?view=manage`}>{({fr:'Retour à mes espaces',en:'Back to my spaces',ln:'Zonga na bisika na ngai',sw:'Rudi kwenye maeneo yangu'})[locale]} →</a>}/>;
}
