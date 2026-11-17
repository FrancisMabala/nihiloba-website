'use client';
import {useRouter,useSearchParams} from 'next/navigation';
import {useState} from 'react';
import NotificationCenter from './notification-center';
import {NotificationDeliveryPreferences} from './notification-delivery-preferences';
import {notificationCopy} from '../../lib/notification-center-copy';
import {messagesText} from '../../lib/messages-design-copy';
import './messages-design.css';
import {MedaMarketplace} from './meda-marketplace';
import {medaDiscoveryCopy} from '../../lib/meda-discovery-copy';
import {medaDestination} from '../../lib/meda-navigation';
export function MessagesSpace({binding,locale}:{binding:string;locale:'en'|'fr'|'ln'|'sw'}){
 const router=useRouter(),params=useSearchParams();
 const meda=params.get('market')==='meda';
 const [view,setView]=useState<'notifications'|'preferences'>(params.has('preferences')?'preferences':'notifications');
 return <div className="messages-space"><p className="space-intro">{messagesText(locale,'intro')}</p><nav className="messages-tabs" aria-label={notificationCopy[locale][0]}><button type="button" aria-pressed={!meda&&view==='notifications'} onClick={()=>{setView('notifications');if(meda)router.push('?view=messages')}}>{notificationCopy[locale][0]}</button><button type="button" aria-pressed={!meda&&view==='preferences'} onClick={()=>{setView('preferences');if(meda)router.push('?view=messages&preferences=1')}}>{messagesText(locale,'preferences')}</button><a href={medaDestination(locale,'enquiries')} aria-current={meda?'page':undefined}>{medaDiscoveryCopy[locale].conversations}</a></nav>{meda?<MedaMarketplace locale={locale} embedded activity/>:view==='notifications'?<NotificationCenter inline binding={binding} apiBase="/api/shida/personal/notifications" locale={locale}/>:<NotificationDeliveryPreferences expanded binding={binding} locale={locale}/>}</div>;
}
