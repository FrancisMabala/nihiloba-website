'use client';
import {useState} from 'react';
import NotificationCenter from './notification-center';
import {NotificationDeliveryPreferences} from './notification-delivery-preferences';
import {notificationCopy} from '../../lib/notification-center-copy';
import {messagesText} from '../../lib/messages-design-copy';
import './messages-design.css';
export function MessagesSpace({binding,locale}:{binding:string;locale:'en'|'fr'|'ln'|'sw'}){
 const [view,setView]=useState<'notifications'|'preferences'>('notifications');
 return <div className="messages-space"><p className="space-intro">{messagesText(locale,'intro')}</p><nav className="messages-tabs" aria-label={notificationCopy[locale][0]}><button type="button" aria-pressed={view==='notifications'} onClick={()=>setView('notifications')}>{notificationCopy[locale][0]}</button><button type="button" aria-pressed={view==='preferences'} onClick={()=>setView('preferences')}>{messagesText(locale,'preferences')}</button></nav>{view==='notifications'?<NotificationCenter inline binding={binding} apiBase="/api/shida/personal/notifications" locale={locale}/>:<NotificationDeliveryPreferences expanded binding={binding} locale={locale}/>}</div>;
}
