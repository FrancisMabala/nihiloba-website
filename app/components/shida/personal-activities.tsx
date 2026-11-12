"use client";
import {ManagedActivityList} from './managed-activity-list';
import {ActivityOverview} from './activity-overview';
import {SpaceIcon,type SpaceIconName} from './account-space-icon';
import type {MarketplaceLocale} from './marketplace-account-copy';
import {spaceSettingsCopy} from '../../lib/space-settings-copy';
import {type ManagedActivity} from '../../lib/personal-activities';
import {OFFICIAL_CHANNELS} from '../../lib/brand';
import {mySpaceCopy} from '../../lib/my-space-refinement-copy';
import {type ActivityData} from '../../lib/use-personal-activity-data';
import {universalSpaceCopy} from '../../lib/universal-space-copy';
import {stayTravelOnboarding} from '../../lib/stay-travel-onboarding';
import {activitiesDesignCopy} from '../../lib/activities-design-copy';


const marketIcon=(market:ManagedActivity['market']):SpaceIconName=>market==='wenze'?'shop':market==='restaurants'?'restaurant':'tool';
export function PersonalActivities({locale,current,onRetry,overview=false}:{overview?:boolean;locale:MarketplaceLocale;current:ActivityData|null;onRetry:()=>void}){
 const u=universalSpaceCopy[locale],c=mySpaceCopy[locale],d=activitiesDesignCopy[locale],labels=spaceSettingsCopy[locale];
 const prefix=locale==='en'?'':`/${locale}`;
 const whatsapp=(message:string)=>{const url=new URL(OFFICIAL_CHANNELS.whatsapp);url.searchParams.set('text',message);return url.href;};
 const card=(title:string,help:string,href:string,icon:SpaceIconName,external=false)=><a key={title} href={href} {...external?{target:'_blank',rel:'noopener noreferrer'}:{}}><span className="activity-option-icon"><SpaceIcon name={icon}/></span><span><strong>{title}</strong><small>{help}</small>{external&&<small className="activity-channel">{d.whatsapp}</small>}</span><span aria-hidden="true">›</span></a>;
 const creation=<div className="activity-options">{current?.options.map(market=>card(market==='wenze'?c.shop:market==='restaurants'?c.restaurant:c.service,market==='wenze'?d.shopHelp:market==='restaurants'?d.restaurantHelp:d.serviceHelp,`${prefix}/shida/seller/${market}`,marketIcon(market)))}{card(labels.sell,labels.sellHelp,`${prefix}/shida/wenze/sell`,'orders')}{card(u.property,u.propertyHelp,`${prefix}/shida/appartements/publier/`,'home')}{card(u.hotel,u.hotelHelp,current?.business?'https://business.nihiloba.com/':whatsapp(stayTravelOnboarding.hotels[locale]),'business',!current?.business)}{card(u.driver,u.driverHelp,whatsapp(stayTravelOnboarding.transport[locale]),'people',true)}{card(d.offer,d.employmentHelp,`${prefix}/shida/space?view=job-offer`,'management')}</div>;
 if(overview)return <ActivityOverview locale={locale} current={current} creation={creation} onRetry={onRetry}/>;
 return <ManagedActivityList locale={locale} current={current} creation={creation} onRetry={onRetry}/>;
}
