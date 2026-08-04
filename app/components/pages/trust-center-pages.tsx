import type { Locale } from "../../lib/i18n";
import { LegalList, LegalPage, LegalRelatedLinks, LegalSection } from "../legal/legal-document";

const trustCopy = {
  en: {
    title: "Trust Center",
    intro: "Trust is built through transparency, responsible product design and continuous improvement. The NIHILOBA Trust Center brings together the policies and resources that explain how we approach privacy, data protection, security and responsible use across our website and SHIDA.",
    section: "Trust and transparency",
    detail: "Privacy and security are considered throughout the design and development of NIHILOBA products. These resources describe our current approach in clear language and will evolve as our products and responsibilities grow.",
  },
  fr: {
    title: "Centre de confiance",
    intro: "La confiance repose sur la transparence, une conception responsable des produits et une amélioration continue. Le Centre de confiance de NIHILOBA rassemble les politiques et les ressources qui expliquent notre approche de la confidentialité, de la protection des données, de la sécurité et de l’utilisation responsable de notre site internet et de SHIDA.",
    section: "Confiance et transparence",
    detail: "La confidentialité et la sécurité sont prises en compte tout au long de la conception et du développement des produits NIHILOBA. Ces ressources présentent clairement notre approche actuelle et évolueront à mesure que nos produits et nos responsabilités se développent.",
  },
} as const;

export function TrustCenterPage({ locale }: { locale: Locale }) {
  const copy = trustCopy[locale];
  return <LegalPage locale={locale} eyebrow={copy.title} title={copy.title} updated={locale === "en" ? "Effective date: August 2026" : "Date d’entrée en vigueur : août 2026"} readingTime={locale === "en" ? "2 min read" : "2 min de lecture"} toc={[{id:"trust-and-transparency",label:copy.section}]} related={false}>
    <LegalSection id="trust-and-transparency" title={copy.section}><p>{copy.intro}</p><p>{copy.detail}</p></LegalSection>
    <LegalRelatedLinks locale={locale} includeContact />
  </LegalPage>;
}

const faqCopy = {
  en: {
    title: "Frequently Asked Questions",
    sections: [
      ["what-is-nihiloba", "What is NIHILOBA?", "NIHILOBA is a technology company developing practical digital solutions that simplify access to everyday services."],
      ["what-is-shida", "What is SHIDA?", "SHIDA is NIHILOBA’s WhatsApp-based platform for employment opportunities, professional services, housing, transport and appointment management."],
      ["how-to-use", "How do I use SHIDA?", "Save the SHIDA WhatsApp number, send “Hello” or “Bonjour”, choose a marketplace and follow the guided steps in WhatsApp."],
      ["personal-information", "How is personal information handled?", "SHIDA aims to collect and share only the information needed for the requested workflow. Details are provided in the Privacy Policy and Data Protection & Privacy page."],
      ["security", "How does NIHILOBA approach security?", "Security is considered throughout product design and software development. The Security page explains the current approach and its limits."],
      ["future-features", "Are all features shown on the website available?", "No. Features identified as planned form part of the current roadmap and are not guarantees of availability or release dates."],
      ["contact", "How can I contact NIHILOBA?", "Questions may currently be sent to shida.nihiloba@gmail.com or through the NIHILOBA contact page."],
    ],
  },
  fr: {
    title: "Questions fréquentes",
    sections: [
      ["quest-ce-que-nihiloba", "Qu’est-ce que NIHILOBA ?", "NIHILOBA est une entreprise technologique qui développe des solutions numériques pratiques afin de simplifier l’accès aux services du quotidien."],
      ["quest-ce-que-shida", "Qu’est-ce que SHIDA ?", "SHIDA est la plateforme de NIHILOBA accessible sur WhatsApp pour les opportunités d’emploi, les services professionnels, le logement, le transport et la gestion des rendez-vous."],
      ["comment-utiliser", "Comment utiliser SHIDA ?", "Enregistrez le numéro WhatsApp de SHIDA, envoyez « Hello » ou « Bonjour », choisissez une place de marché et suivez les étapes guidées dans WhatsApp."],
      ["donnees-personnelles", "Comment les données personnelles sont-elles traitées ?", "SHIDA vise à collecter et à partager uniquement les informations nécessaires au processus demandé. La Politique de confidentialité et la page Protection des données et de la vie privée fournissent davantage de précisions."],
      ["securite", "Quelle est l’approche de NIHILOBA en matière de sécurité ?", "La sécurité est prise en compte tout au long de la conception des produits et du développement logiciel. La page Sécurité présente l’approche actuelle et ses limites."],
      ["fonctionnalites-futures", "Toutes les fonctionnalités présentées sur le site sont-elles disponibles ?", "Non. Les fonctionnalités indiquées comme prévues font partie de la feuille de route actuelle et ne constituent pas des garanties de disponibilité ou de date de lancement."],
      ["contact", "Comment contacter NIHILOBA ?", "Les questions peuvent actuellement être envoyées à shida.nihiloba@gmail.com ou au moyen de la page de contact de NIHILOBA."],
    ],
  },
} as const;

export function FaqPage({ locale }: { locale: Locale }) {
  const copy = faqCopy[locale];
  const toc = copy.sections.map(([id,title])=>({id,label:title}));
  return <LegalPage locale={locale} eyebrow={locale === "en" ? "Trust Center" : "Centre de confiance"} title={copy.title} updated={locale === "en" ? "Effective date: August 2026" : "Date d’entrée en vigueur : août 2026"} readingTime={locale === "en" ? "4 min read" : "4 min de lecture"} toc={toc} related={false}>
    {copy.sections.map(([id,title,text])=><LegalSection id={id} title={title} key={id}><p>{text}</p></LegalSection>)}
    <LegalRelatedLinks locale={locale} current="faq" />
  </LegalPage>;
}

const acceptableCopy = {
  en: {
    title: "Acceptable Use Policy",
    sections: [
      {id:"purpose",title:"1. Purpose",paragraphs:["This Acceptable Use Policy explains the basic standards that apply when using the NIHILOBA website and SHIDA.","It should be read together with the Terms of Use."],items:undefined},
      {id:"responsible-use",title:"2. Responsible Use",paragraphs:["Users are expected to use SHIDA responsibly and only for legitimate purposes."],items:["keep their information reasonably accurate;","respect other users;","communicate honestly;","review information before submitting requests."]},
      {id:"prohibited-activities",title:"3. Prohibited Activities",paragraphs:["Users must not use SHIDA to:"],items:["publish fraudulent information;","impersonate another individual or organisation;","distribute illegal content;","harass, threaten or abuse other users;","interfere with the operation of the platform;","attempt unauthorised access to systems or accounts;","distribute malware or harmful software;","conduct activities prohibited by applicable law."]},
      {id:"enforcement",title:"4. Enforcement",paragraphs:["NIHILOBA may suspend or remove access where necessary to protect users, investigate abuse, maintain platform security or comply with legal obligations.","Whenever reasonably possible, appropriate explanations will be provided."],items:undefined},
      {id:"contact",title:"5. Contact",paragraphs:["Questions or reports concerning acceptable use may be sent to shida.nihiloba@gmail.com."],items:undefined},
    ],
  },
  fr: {
    title: "Politique d’utilisation acceptable",
    sections: [
      {id:"objet",title:"1. Objet",paragraphs:["La présente Politique d’utilisation acceptable explique les règles fondamentales applicables à l’utilisation du site internet de NIHILOBA et de SHIDA.","Elle doit être lue avec les Conditions d’utilisation."],items:undefined},
      {id:"utilisation-responsable",title:"2. Utilisation responsable",paragraphs:["Les utilisateurs doivent utiliser SHIDA de manière responsable et uniquement à des fins légitimes."],items:["maintenir leurs informations raisonnablement exactes ;","respecter les autres utilisateurs ;","communiquer honnêtement ;","vérifier les informations avant d’envoyer des demandes."]},
      {id:"activites-interdites",title:"3. Activités interdites",paragraphs:["Les utilisateurs ne doivent pas utiliser SHIDA pour :"],items:["publier des informations frauduleuses ;","usurper l’identité d’une autre personne ou organisation ;","diffuser du contenu illégal ;","harceler, menacer ou maltraiter d’autres utilisateurs ;","perturber le fonctionnement de la plateforme ;","tenter d’accéder sans autorisation à des systèmes ou à des comptes ;","diffuser des logiciels malveillants ou nuisibles ;","mener des activités interdites par la loi applicable."]},
      {id:"application",title:"4. Application",paragraphs:["NIHILOBA peut suspendre ou supprimer un accès lorsque cela est nécessaire pour protéger les utilisateurs, enquêter sur des abus, maintenir la sécurité de la plateforme ou respecter des obligations légales.","Dans la mesure du raisonnable, des explications appropriées seront fournies."],items:undefined},
      {id:"contact",title:"5. Contact",paragraphs:["Les questions ou signalements concernant l’utilisation acceptable peuvent être envoyés à shida.nihiloba@gmail.com."],items:undefined},
    ],
  },
} as const;

export function AcceptableUsePage({ locale }: { locale: Locale }) {
  const copy = acceptableCopy[locale];
  const toc=copy.sections.map(({id,title})=>({id,label:title.replace(/^\d+\.\s*/,"")}));
  return <LegalPage locale={locale} eyebrow={locale === "en" ? "Trust Center" : "Centre de confiance"} title={copy.title} updated={locale === "en" ? "Effective date: August 2026" : "Date d’entrée en vigueur : août 2026"} readingTime={locale === "en" ? "4 min read" : "4 min de lecture"} toc={toc} related={false}>
    {copy.sections.map(section=><LegalSection id={section.id} title={section.title} key={section.id}>{section.paragraphs.map(p=><p key={p}>{p}</p>)}{section.items&&<LegalList items={section.items}/>}</LegalSection>)}
    <LegalRelatedLinks locale={locale} current="acceptable" />
  </LegalPage>;
}
