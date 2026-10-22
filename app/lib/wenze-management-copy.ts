export const managementRefinement = {
 en:{search:"Search stock",all:"All stock",available:"Available",out:"Out of stock",low:"Low stock",advanced:"Movements and reservations",sales:"Sales",costs:"Costs and inventory",performance:"Performance",exports:"Exports and report history",scope:"Reports use UTC dates. Recorded sales are not proof of payment. CDF and USD remain separate.",coverage:"Sales cost coverage is the share of recorded revenue with a cost snapshot in this period. Inventory coverage counts current stock items with known costs; the scopes differ.",partial:"Known profit only — some sales lack purchase costs.",adjust:"Adjust stock"},
 fr:{search:"Rechercher dans le stock",all:"Tout le stock",available:"Disponible",out:"Épuisé",low:"Stock faible",advanced:"Mouvements et réservations",sales:"Ventes",costs:"Coûts et stock",performance:"Performance",exports:"Exports et historique des rapports",scope:"Les rapports utilisent les dates UTC. Une vente enregistrée ne prouve pas le paiement. CDF et USD restent séparés.",coverage:"La couverture des coûts des ventes est la part du chiffre d’affaires avec un coût enregistré sur cette période. Celle du stock compte les articles actuels dont le coût est connu : les périmètres diffèrent.",partial:"Bénéfice connu uniquement — certains coûts d’achat manquent.",adjust:"Ajuster le stock"},
 ln:{search:"Luka na stock",all:"Stock nyonso",available:"Ezali",out:"Esili",low:"Stock moke",advanced:"Mouvements mpe réservations",sales:"Batekisi",costs:"Ntalo ya kosomba mpe stock",performance:"Bokoli",exports:"Bimisa mpe tala ba rapports",scope:"Ba rapports esalelaka mikolo UTC. Vente ekomami ezali preuve ya kofuta te. CDF mpe USD ekeseni.",coverage:"Couverture ya vente ezali eteni ya revenu oyo ntalo ya kosomba eyebani na eleko oyo. Ya stock etangaka biloko ya sikoyo oyo ntalo eyebani; ezali ndenge moko te.",partial:"Bénéfice eyebani kaka — ntalo mosusu ya kosomba ezangi.",adjust:"Bongisa stock"},
 sw:{search:"Tafuta kwenye hisa",all:"Hisa zote",available:"Zinapatikana",out:"Zimeisha",low:"Hisa chache",advanced:"Mienendo na nafasi zilizohifadhiwa",sales:"Mauzo",costs:"Gharama na hisa",performance:"Utendaji",exports:"Pakua na historia ya ripoti",scope:"Ripoti zinatumia tarehe za UTC. Mauzo yaliyorekodiwa si uthibitisho wa malipo. CDF na USD zinabaki tofauti.",coverage:"Ufunikaji wa gharama za mauzo ni sehemu ya mapato yenye gharama iliyohifadhiwa katika kipindi hiki. Ufunikaji wa hisa unahesabu bidhaa za sasa zenye gharama inayojulikana; wigo unatofautiana.",partial:"Faida inayojulikana tu — baadhi ya gharama za ununuzi hazipo.",adjust:"Rekebisha hisa"},
} as const;

export function formatWenzeFact(value:unknown,key:string,locale:string):string{
 if(value===null||value===undefined)return "—";
 if(/(_at|_on|period_start|period_end)$/.test(key)&&typeof value==="string"){
  const date=new Date(value.length===10?value+"T12:00:00Z":value);
  if(Number.isNaN(date.getTime()))return "—";
  return new Intl.DateTimeFormat(locale,{dateStyle:"medium",...(value.length===10?{}:{timeStyle:"short" as const}),timeZone:"UTC"}).format(date)+(value.length===10?"":" UTC");
 }
 if(typeof value==="number"||typeof value==="string"&&/^-?\d+(\.\d+)?$/.test(value))return new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(Number(value));
 return String(value);
}
