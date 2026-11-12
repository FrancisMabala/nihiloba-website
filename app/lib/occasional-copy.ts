export type OccLocale='fr'|'en'|'ln'|'sw';
const words:Record<string,string[]> = {
 modify: ['Modifier','Edit','Bongisá','Hariri'],
 profileTitle: ["Mon profil pour les emplois de particuliers","My profile for household jobs","Profil na ngai mpo na misala ya bato","Wasifu wangu kwa kazi za watu binafsi"],
 wewa: ["Conduite de wewa","Wewa driving","Kotambwisa wewa","Kuendesha wewa"],
 selected: ["{n} sur 3 sélectionnées","{n} of 3 selected","{n} na 3 eponami","{n} kati ya 3 zimechaguliwa"],
 chooseCity: ["Choisir une ville","Choose a city","Poná engumba","Chagua jiji"],
 searchCity: ["Rechercher ou saisir une ville","Search or enter a city","Luká to komá engumba","Tafuta au andika jiji"],
 commune: ["Commune de travail","Work municipality","Komine ya mosala","Manispaa ya kazi"],
 chooseCommune: ["Choisir une commune","Choose a municipality","Poná komine","Chagua manispaa"],
 searchCommune: ["Rechercher une commune","Search municipalities","Luká komine","Tafuta manispaa"],
 step: ["Étape {n} sur 3","Step {n} of 3","Etape {n} na 3","Hatua ya {n} kati ya 3"],
 view: ["Voir mon profil","View my profile","Talá profil na ngai","Angalia wasifu wangu"],
 editProfile: ["Modifier le profil","Edit profile","Bongisá profil","Hariri wasifu"],
 backProfiles: ["Retour à mes profils","Back to my profiles","Zongá na baprofil na ngai","Rudi kwenye wasifu wangu"],
 verify: ["Vérifier mon profil","Review my profile","Talá profil na ngai","Kagua wasifu wangu"],
 skills: ["Savoir-faire","Skills","Makoki","Ujuzi"],
 xp: ["Expérience","Experience","Boyebi ya mosala","Uzoefu"],
 updated: ["Votre profil a été modifié.","Your profile was updated.","Profil na yo ebongisami.","Wasifu wako umesasishwa."],
 optional: ["(facultatif)","(optional)","(soki olingi)","(si lazima)"],
 freqLabel: ["Fréquence","Frequency","Mbala boni","Mara ngapi"],
 missionLabel: ["Missions","Missions","Misala","Kazi"],
 privacy: ["Visibilité","Visibility","Komonana","Mwonekano"],
 "create": [
  "Créer mon profil de travail occasionnel",
  "Create my occasional work profile",
  "Kosala profil na ngai ya misala ya ntango moke",
  "Unda wasifu wangu wa kazi za muda"
 ],
 "edit": [
  "Modifier mon profil de travail occasionnel",
  "Edit my occasional work profile",
  "Kobongisa profil na ngai ya misala ya ntango moke",
  "Hariri wasifu wangu wa kazi za muda"
 ],
 "s1": [
  "Mes missions et disponibilités",
  "My missions and availability",
  "Misala mpe ntango na ngai",
  "Kazi na upatikanaji wangu"
 ],
 "s2": [
  "Mon savoir-faire",
  "My practical skills",
  "Makoki na ngai",
  "Ujuzi wangu"
 ],
 "s3": [
  "Vérifier et créer mon profil",
  "Review and create my profile",
  "Kotala mpe kosala profil na ngai",
  "Kagua na uunde wasifu"
 ],
 "missions": [
  "Quelles missions souhaitez-vous faire ?",
  "Which missions would you like to do?",
  "Olingi kosala misala nini ?",
  "Ungependa kufanya kazi gani?"
 ],
 "limit": [
  "Jusqu’à 3 missions",
  "Up to 3 missions",
  "Misala kino 3",
  "Hadi kazi 3"
 ],
 "custom": [
  "Ajouter une autre mission",
  "Enter another mission",
  "Kokoma mosala mosusu",
  "Andika kazi nyingine"
 ],
 "childcare": [
  "Garde d’enfants",
  "Childcare",
  "Kokɛngɛla bana",
  "Kutunza watoto"
 ],
 "cleaning": [
  "Ménage et entretien",
  "Cleaning and housekeeping",
  "Bopɛto ya ndako",
  "Usafi wa nyumba"
 ],
 "laundry": [
  "Lessive et repassage",
  "Laundry and ironing",
  "Kosukola mpe kolalisa bilamba",
  "Kufua na kupiga pasi"
 ],
 "kitchen": [
  "Aide en cuisine",
  "Kitchen help",
  "Kosunga na kuku",
  "Kusaidia jikoni"
 ],
 "service": [
  "Service en salle",
  "Table service",
  "Kosalela bato na mesa",
  "Kuhudumia mezani"
 ],
 "bar": [
  "Service au bar lors d’un événement",
  "Event bar service",
  "Kokabola masanga na fɛti",
  "Kuhudumia baa kwenye hafla"
 ],
 "area": [
  "Où pouvez-vous travailler ?",
  "Where can you work?",
  "Okoki kosala wapi ?",
  "Unaweza kufanya kazi wapi?"
 ],
 "city": [
  "Ville",
  "Town or city",
  "Engumba",
  "Jiji"
 ],
 "communes": [
  "Communes",
  "Municipalities",
  "Bakomine",
  "Manispaa"
 ],
 "district": [
  "Quartier (facultatif)",
  "Neighbourhood (optional)",
  "Kartye (soki olingi)",
  "Mtaa (si lazima)"
 ],
 "when": [
  "Quand êtes-vous disponible ?",
  "When are you available?",
  "Ozali na ntango ntango nini ?",
  "Unapatikana lini?"
 ],
 "mon": [
  "Lundi",
  "Monday",
  "Lundi",
  "Jumatatu"
 ],
 "tue": [
  "Mardi",
  "Tuesday",
  "Mardi",
  "Jumanne"
 ],
 "wed": [
  "Mercredi",
  "Wednesday",
  "Mercredi",
  "Jumatano"
 ],
 "thu": [
  "Jeudi",
  "Thursday",
  "Jeudi",
  "Alhamisi"
 ],
 "fri": [
  "Vendredi",
  "Friday",
  "Vendredi",
  "Ijumaa"
 ],
 "sat": [
  "Samedi",
  "Saturday",
  "Samedi",
  "Jumamosi"
 ],
 "sun": [
  "Dimanche",
  "Sunday",
  "Dimanche",
  "Jumapili"
 ],
 "morning": [
  "Matin",
  "Morning",
  "Na ntɔngɔ",
  "Asubuhi"
 ],
 "afternoon": [
  "Après-midi",
  "Afternoon",
  "Nsima ya nzanga",
  "Alasiri"
 ],
 "evening": [
  "En soirée",
  "Evening",
  "Na mpokwa",
  "Jioni"
 ],
 "flexible": [
  "À convenir",
  "To be agreed",
  "Tokoyokana",
  "Kwa makubaliano"
 ],
 "frequency": [
  "À quelle fréquence ?",
  "How often?",
  "Mbala boni ?",
  "Mara ngapi?"
 ],
 "once": [
  "Missions ponctuelles",
  "One-off",
  "Mbala moko",
  "Mara moja"
 ],
 "regular": [
  "Travail régulier",
  "Regularly, a few hours",
  "Mbala na mbala, mwa bangonga",
  "Mara kwa mara, saa chache"
 ],
 "tasks": [
  "Que savez-vous faire pour cette mission ?",
  "What can you do for this mission?",
  "Okoki kosala nini na mosala oyo ?",
  "Unaweza kufanya nini kwa kazi hii?"
 ],
 "addTask": [
  "Ajouter un savoir-faire",
  "Add a skill",
  "Kobakisa likoki",
  "Ongeza ujuzi"
 ],
 "experience": [
  "Avez-vous déjà effectué cette mission ?",
  "Have you done this work before?",
  "Osalá mosala oyo liboso ?",
  "Umewahi kufanya kazi hii?"
 ],
 "beginner": [
  "Je débute",
  "I am starting out",
  "Nazali kobanda",
  "Ninaanza"
 ],
 "friends": [
  "Oui, pour des proches",
  "Yes, for people I know",
  "Ɛɛ, mpo na bato ya penepene",
  "Ndiyo, kwa watu ninaowajua"
 ],
 "paid": [
  "Oui, lors de missions rémunérées",
  "Yes, as paid work",
  "Ɛɛ, na misala ya lifuti",
  "Ndiyo, kwa malipo"
 ],
 "example": [
  "Un exemple de votre savoir-faire (facultatif)",
  "An example of your skills (optional)",
  "Ndakisa ya makoki na yo (soki olingi)",
  "Mfano wa ujuzi wako (si lazima)"
 ],
 "rate": [
  "Rémunération souhaitée",
  "Preferred pay",
  "Lifuti oyo olingi",
  "Malipo unayotaka"
 ],
 "amount": [
  "Indiquer un montant",
  "Enter an amount",
  "Kokoma motuya",
  "Weka kiasi"
 ],
 "omit": [
  "Non précisée",
  "Not specified",
  "Elobami te",
  "Haijabainishwa"
 ],
 "hour": [
  "Par heure",
  "Per hour",
  "Na ngonga",
  "Kwa saa"
 ],
 "day": [
  "Par jour",
  "Per day",
  "Na mokolo",
  "Kwa siku"
 ],
 "mission": [
  "Par mission",
  "Per mission",
  "Na mosala",
  "Kwa kazi"
 ],
 "allow": [
  "Permettre aux particuliers de trouver mon profil pour leurs missions",
  "Allow individuals to find my profile for their missions",
  "Kopesa nzela bato bámona profil na ngai mpo na misala na bango",
  "Ruhusu watu wenye kazi zinazofaa kupata wasifu wangu"
 ],
 "private": [
  "Votre profil reste privé. Si vous postulez à une mission, le particulier qui l’a publiée pourra consulter votre candidature.",
  "Your profile stays private. If you apply, the person who posted that mission can see your application.",
  "Profil na yo etikali ya yo moko. Soki osɛngi mosala, moto oyo abimisaki yango akoki kotala bosɛngi na yo.",
  "Wasifu wako utabaki wa faragha. Ukiomba kazi, mtu aliyeichapisha ataona ombi lako."
 ],
 "visible": [
  "Les particuliers qui ont publié une mission correspondant à votre profil peuvent vous trouver sur SHIDA.",
  "Individuals who posted a matching mission can find you on SHIDA.",
  "Bato oyo babimisaki mosala oyo ekokani na profil na yo bakoki kokuta yo na SHIDA.",
  "Watu waliochapisha kazi inayolingana wanaweza kukupata kwenye SHIDA."
 ],
 "confirm": [
  "Je confirme ces informations.",
  "I confirm this information.",
  "Nandimi makambo oyo.",
  "Ninathibitisha taarifa hizi."
 ],
 "submit": [
  "Créer mon profil",
  "Create my profile",
  "Kosala profil na ngai",
  "Unda wasifu wangu"
 ],
 "fix1": [
  "Modifier mes missions et disponibilités",
  "Edit missions and availability",
  "Kobongisa misala mpe ntango",
  "Hariri kazi na upatikanaji"
 ],
 "fix2": [
  "Modifier mon savoir-faire",
  "Edit my skills",
  "Kobongisa makoki",
  "Hariri ujuzi"
 ],
 "fix3": [
  "Modifier ma rémunération",
  "Edit my pay",
  "Kobongisa lifuti",
  "Hariri malipo"
 ],
 "review": [
  "Revenir à la vérification",
  "Return to review",
  "Kozonga na botali",
  "Rudi kukagua"
 ],
 "invalid": [
  "Vérifiez ce champ avant de continuer.",
  "Check this field before continuing.",
  "Talá esika oyo liboso ya kokoba.",
  "Kagua sehemu hii kabla ya kuendelea."
 ],
 "badDistrict": [
  "Indiquez le nom du quartier ou laissez ce champ vide.",
  "Enter a neighbourhood name or leave this blank.",
  "Komá nkombo ya kartye to tiká esika polele.",
  "Andika jina la mtaa au acha wazi."
 ],
 "homework": [
  "Aider aux devoirs",
  "Help with homework",
  "Kosunga na mosala ya kelasi",
  "Kusaidia kazi za shule"
 ],
 "snack": [
  "Préparer le goûter",
  "Prepare snacks",
  "Kobongisa mwa bilei",
  "Kuandaa vitafunio"
 ],
 "games": [
  "Organiser des jeux",
  "Organize games",
  "Kobongisa masano",
  "Kupanga michezo"
 ],
 "floor": [
  "Nettoyer les sols",
  "Clean floors",
  "Kopɛtola mabele",
  "Kusafisha sakafu"
 ],
 "iron": [
  "Repasser",
  "Iron clothes",
  "Kolalisa bilamba",
  "Kupiga pasi"
 ],
 "wash": [
  "Laver le linge",
  "Wash clothes",
  "Kosukola bilamba",
  "Kufua"
 ],
 "prep": [
  "Préparer les ingrédients",
  "Prepare ingredients",
  "Kobongisa biloko ya kolamba",
  "Kuandaa viungo"
 ],
 "tables": [
  "Dresser les tables",
  "Set tables",
  "Kobongisa bamesa",
  "Kupanga meza"
 ],
 "drinks": [
  "Servir les boissons",
  "Serve drinks",
  "Kokabola masanga",
  "Kutoa vinywaji"
 ],
 "setup": [
  "Installer le bar",
  "Set up the bar",
  "Kobongisa bar",
  "Kuandaa baa"
 ],
 "add": [
  "Ajouter",
  "Add",
  "Kobakisa",
  "Ongeza"
 ],
 "days": [
  "Jours",
  "Days",
  "Mikolo",
  "Siku"
 ],
 "slots": [
  "Créneaux",
  "Time slots",
  "Bangonga",
  "Vipindi"
 ],
 "unit": [
  "Unité",
  "Unit",
  "Emekeli",
  "Kipimo"
 ],
 "currency": [
  "Devise",
  "Currency",
  "Mosolo",
  "Sarafu"
 ],
 "saved": [
  "Votre profil pour les emplois de particuliers a été créé.",
  "Your profile has been saved.",
  "Profil na yo ebombami.",
  "Wasifu wako umehifadhiwa."
 ]
};
export const occText=(locale:OccLocale,key:string)=>words[key]?.[(['fr','en','ln','sw'] as const).indexOf(locale)]??key;
