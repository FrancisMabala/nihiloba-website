import {occText,type OccLocale} from './occasional-copy';
const words:Record<string,string[]> = {
 "title": [
  "Publier une mission",
  "Publish a mission",
  "Kobimisa mosala",
  "Chapisha kazi"
 ],
 "s1": [
  "La mission",
  "The mission",
  "Mosala",
  "Kazi"
 ],
 "s2": [
  "Les conditions",
  "Conditions",
  "Makambo ya mosala",
  "Masharti"
 ],
 "s3": [
  "Vérifier et publier",
  "Review and publish",
  "Kotala mpe kobimisa",
  "Kagua na uchapishe"
 ],
 "category": [
  "Pour quelle mission cherchez-vous quelqu’un ?",
  "What mission are you hiring for?",
  "Ozali koluka moto mpo na mosala nini ?",
  "Unatafuta mtu kwa kazi gani?"
 ],
 "custom": [
  "Autre",
  "Other",
  "Mosusu",
  "Nyingine"
 ],
 "customName": [
  "Précisez la mission",
  "Specify the mission",
  "Limbolá mosala",
  "Eleza kazi"
 ],
 "job": [
  "Titre de l’annonce",
  "Listing title",
  "Motó ya liyebisi",
  "Kichwa cha tangazo"
 ],
 "short_summary": [
  "Que devra faire la personne ?",
  "What will the person do?",
  "Moto akosala nini ?",
  "Mtu atafanya nini?"
 ],
 "descriptionHelp": [
  "Indiquez la tâche à réaliser, par exemple garder deux enfants pendant la soirée.",
  "Describe the task, for example looking after two children for the evening.",
  "Limbolá mosala, lokola kokɛngɛla bana mibale na mpokwa.",
  "Eleza kazi, kwa mfano kutunza watoto wawili jioni."
 ],
 "privacy": [
  "Indiquez la zone de travail, sans adresse exacte.",
  "Give the work area without an exact address.",
  "Pesá esika ya mosala, kasi adresi ya sikisiki te.",
  "Weka eneo la kazi bila anwani kamili."
 ],
 "quartier": [
  "Quartier",
  "Neighbourhood",
  "Kartye",
  "Mtaa"
 ],
 "manual": [
  "Mon quartier ne figure pas dans la liste",
  "My neighbourhood is not listed",
  "Kartye na ngai ezali na liste te",
  "Mtaa wangu haupo kwenye orodha"
 ],
 "conditions": [
  "Horaires et rémunération",
  "Schedule and pay",
  "Bangonga mpe lifuti",
  "Ratiba na malipo"
 ],
 "once": [
  "Une seule fois",
  "Once",
  "Mbala moko",
  "Mara moja"
 ],
 "regular": [
  "Régulièrement",
  "Regularly",
  "Mbala na mbala",
  "Mara kwa mara"
 ],
 "frequency": [
  "Fréquence",
  "Frequency",
  "Mbala boni",
  "Marudio"
 ],
 "day": [
  "Date de la mission",
  "Mission date",
  "Mokolo ya mosala",
  "Tarehe ya kazi"
 ],
 "date_flexible": [
  "Date à convenir",
  "Date to be agreed",
  "Mokolo ya koyokana",
  "Tarehe kwa makubaliano"
 ],
 "schedule_note": [
  "Autre organisation des jours",
  "Custom schedule",
  "Mikolo mosusu",
  "Ratiba nyingine"
 ],
 "start_date": [
  "Date de début (facultatif)",
  "Start date (optional)",
  "Mokolo ya kobanda (soki olingi)",
  "Tarehe ya kuanza (si lazima)"
 ],
 "hours": [
  "Horaires",
  "Hours",
  "Bangonga",
  "Saa"
 ],
 "fixed": [
  "Horaires fixes",
  "Fixed hours",
  "Bangonga ya sikisiki",
  "Saa maalumu"
 ],
 "flexible": [
  "Horaires à convenir",
  "Flexible hours",
  "Bangonga ya koyokana",
  "Saa kwa makubaliano"
 ],
 "start": [
  "Heure de début",
  "Start time",
  "Ngonga ya kobanda",
  "Saa ya kuanza"
 ],
 "end": [
  "Heure de fin",
  "End time",
  "Ngonga ya kosilisa",
  "Saa ya mwisho"
 ],
 "overnight": [
  "Se termine le lendemain",
  "Ends the next day",
  "Esili mokolo elandi",
  "Inaisha siku inayofuata"
 ],
 "pay": [
  "Rémunération (facultatif)",
  "Pay (optional)",
  "Lifuti (soki olingi)",
  "Malipo (si lazima)"
 ],
 "experience": [
  "Expérience souhaitée (facultatif)",
  "Preferred experience (optional)",
  "Boyebi oyo olingi (soki olingi)",
  "Uzoefu unaotakiwa (si lazima)"
 ],
 "beginner": [
  "Débutant accepté",
  "Beginners welcome",
  "Baoyo bazali kobanda bakoki",
  "Anayeanza anakubaliwa"
 ],
 "change1": [
  "Modifier la mission",
  "Edit the mission",
  "Kobongisa mosala",
  "Hariri kazi"
 ],
 "change2": [
  "Modifier les conditions",
  "Edit conditions",
  "Kobongisa makambo ya mosala",
  "Hariri masharti"
 ],
 "confirm": [
  "J’ai vérifié les informations de cette mission",
  "I have checked the details of this mission",
  "Nataleli makambo ya mosala oyo",
  "Nimekagua taarifa za kazi hii"
 ],
 "publish": [
  "Publier ma mission",
  "Publish my mission",
  "Kobimisa mosala na ngai",
  "Chapisha kazi yangu"
 ],
 "received": [
  "Voir les candidatures",
  "View applications",
  "Kotala bosɛngi",
  "Tazama maombi"
 ],
 "find": [
  "Trouver des candidats pour cette mission",
  "Find candidates for this mission",
  "Koluka bato mpo na mosala oyo",
  "Tafuta wagombea kwa kazi hii"
 ],
 "legacy": [
  "Conditions de votre ancien brouillon",
  "Previous draft conditions",
  "Makambo ya mosala oyo obombaki",
  "Masharti ya rasimu iliyopita"
 ],
 "area": [
  "Zone de travail",
  "Work area",
  "Esika ya mosala",
  "Eneo la kazi"
 ]
};
export const missionText=(l:OccLocale,k:string)=>words[k]?.[(['fr','en','ln','sw'] as const).indexOf(l)]??occText(l,k);
