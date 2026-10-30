type Locale='en'|'fr'|'ln'|'sw';
const text={
 preferences:['Preferences','Préférences','Maponi','Mapendeleo'],
 intro:['Find important updates about your activities, orders and requests here. Conversations and replies happen on WhatsApp.','Retrouvez ici les informations importantes concernant vos activités, commandes et demandes. Les conversations et les réponses se font sur WhatsApp.','Tala makambo ya ntina ya misala, biloko osombi mpe masengi na yo awa. Masolo mpe biyano esalemaka na WhatsApp.','Pata taarifa muhimu kuhusu shughuli, maagizo na maombi yako hapa. Mazungumzo na majibu hufanyika kwenye WhatsApp.'],
 emptyBody:['Your orders, requests and important updates will appear here.','Vos commandes, demandes et informations importantes apparaîtront ici.','Biloko osombi, masengi mpe makambo ya ntina ekomonana awa.','Maagizo, maombi na taarifa muhimu zitaonekana hapa.'],
 explore:['Explore SHIDA','Découvrir SHIDA','Tala SHIDA','Gundua SHIDA'],
 new:['Unread','Non lue','Etángami naino te','Haijasomwa'],
 info:['Information','Information','Likambo','Taarifa'],
 allRead:['Mark all as read','Tout marquer comme lu','Tya ete otángi nyonso','Weka zote zimesomwa'],
 protect:['Protect my account','Protéger mon compte','Batela konti na ngai','Linda akaunti yangu'],
 protectHelp:['Protect your SHIDA account if you lose access to your phone.','Protégez votre compte SHIDA si vous perdez l’accès à votre téléphone.','Batela konti na yo ya SHIDA soki okoki lisusu kosalela telefone te.','Linda akaunti yako ya SHIDA ukipoteza ufikiaji wa simu yako.'],
 order:['View order','Voir la commande','Tala komande','Tazama agizo'],
 request:['View request','Voir la demande','Tala lisengi','Tazama ombi'],
 application:['View application','Voir la candidature','Tala demande ya mosala','Tazama ombi la kazi'],
 badge:['Unread alerts in badge','Alertes non lues dans le compteur','Mayebisi etángami te na motángo','Arifa ambazo hazijasomwa kwenye hesabu'],
} as const;
export function messagesText(locale:Locale,key:keyof typeof text){return text[key][{en:0,fr:1,ln:2,sw:3}[locale]];}
