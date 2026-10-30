type Locale='en'|'fr'|'ln'|'sw';
const text={
 intro:['Protect your account and manage your recovery options.','Protégez votre compte et gérez vos options de récupération.','Batela konti na yo mpe bongisa banzela ya kozongisa yango.','Linda akaunti yako na udhibiti njia za kuirejesha.'],
 delay:['New recovery methods become usable after 24 hours.','Les nouvelles méthodes de récupération sont utilisables après 24 heures.','Banzela ya sika ya kozongisa konti esalaka nsima ya ngonga 24.','Njia mpya za kurejesha akaunti hutumika baada ya saa 24.'],
 passkey:['Passkey','Clé d’accès','Fungola ya bokoti','Ufunguo wa kuingia'],
 country:['Country','Pays','Mboka','Nchi'],
 emailHelp:['Add an email address to recover your account.','Ajoutez une adresse e-mail pour récupérer votre compte.','Bakisa e-mail mpo na kozongisa konti na yo.','Ongeza barua pepe ya kurejesha akaunti yako.'],
 phoneHelp:['Add another verified number for account recovery.','Ajoutez un autre numéro vérifié pour récupérer votre compte.','Bakisa nimero mosusu endimami mpo na kozongisa konti.','Ongeza nambari nyingine iliyothibitishwa ya kurejesha akaunti.'],
 passphraseHelp:['Create a secret phrase to recover your account.','Créez une phrase secrète pour récupérer votre compte.','Sala fraze ya sekele mpo na kozongisa konti.','Unda kauli ya siri ya kurejesha akaunti yako.'],
 codeHelp:['Generate a backup code and keep it somewhere safe.','Générez un code de secours et conservez-le en lieu sûr.','Bimisa kode ya lisungi mpe bomba yango na esika ya bokengi.','Tengeneza msimbo wa akiba na uhifadhi salama.'],
 methodProof:['Adding, replacing or removing a method requires an established passkey or recovery email.','L’ajout, le remplacement ou le retrait d’une méthode nécessite une clé d’accès ou un e-mail de récupération déjà actif.','Kobakisa, kobongola to kolongola nzela esengi fungola to e-mail ya kozongisa konti oyo esi esalaka.','Kuongeza, kubadilisha au kuondoa njia kunahitaji ufunguo au barua pepe ya urejeshaji iliyo tayari kutumika.'],
 sessionsHelp:['Sign out your other browsers after verifying your identity.','Déconnectez vos autres navigateurs après avoir vérifié votre identité.','Bimisa bokoti ya banavigateur mosusu nsima ya kondimisa yo.','Ondoa vipindi vya vivinjari vingine baada ya kuthibitisha utambulisho wako.'],
 danger:['Danger zone','Zone sensible','Esika ya bokebi','Eneo la tahadhari'],
 dangerHelp:['Account deletion is permanent. For a lost or stolen phone, use the protection and recovery process.','La suppression du compte est définitive. En cas de téléphone perdu ou volé, utilisez la procédure de protection et de récupération.','Kolongola konti ekoki kozongisama te. Soki telefone ebungi to bayibi yango, salela nzela ya bobateli mpe kozongisa konti.','Kufuta akaunti ni kwa kudumu. Kwa simu iliyopotea au kuibwa, tumia utaratibu wa ulinzi na urejeshaji.'],
} as const;
export function accountDesignText(locale:Locale,key:keyof typeof text){return text[key][{en:0,fr:1,ln:2,sw:3}[locale]];}
export function countryName(locale:Locale,code:string|null|undefined){
 if(!code)return '—';
 if(!/^[a-z]{2}$/i.test(code))return code;
 try{return new Intl.DisplayNames([locale],{type:'region'}).of(code.toUpperCase())||code;}catch{return code;}
}
