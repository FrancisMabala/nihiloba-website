import type { Locale } from "../../lib/i18n";
import { CONTACT_EMAILS } from "../../lib/brand";
import { LegalList, LegalPage, LegalRelatedLinks, LegalSection } from "../legal/legal-document";

type PolicyBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: readonly string[] }
  | { type: "subsection"; title: string; paragraphs?: readonly string[]; items?: readonly string[] };

type PolicySection = {
  id: string;
  title: string;
  blocks: readonly PolicyBlock[];
};

const policy: Record<Locale, {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  sections: readonly PolicySection[];
  finalTitle: string;
  finalParagraphs: readonly string[];
  resourcesTitle: string;
  resources: readonly { label: string; path: string }[];
}> = {
  en: {
    eyebrow: "Privacy and data protection",
    title: "Privacy Policy",
    effectiveDate: "Effective date: August 2026",
    sections: [
      { id: "introduction", title: "1. Introduction", blocks: [
        { type: "paragraph", text: "Welcome to NIHILOBA." },
        { type: "paragraph", text: "This Privacy Policy explains how NIHILOBA collects, uses, stores and protects personal information when you use our website, our digital products and services, including SHIDA, our WhatsApp-based platform." },
        { type: "paragraph", text: "At NIHILOBA, we believe privacy should not be an afterthought. Protecting personal information is a fundamental part of how we design and develop our products. Whenever possible, SHIDA is built to collect only the information necessary to provide the requested service." },
        { type: "paragraph", text: "By using SHIDA or the NIHILOBA website, you acknowledge the practices described in this Privacy Policy." },
      ] },
      { id: "who-we-are", title: "2. Who We Are", blocks: [
        { type: "paragraph", text: "NIHILOBA is a technology company developing practical digital solutions that simplify access to everyday services." },
        { type: "paragraph", text: "Our first product is SHIDA, a platform operating through WhatsApp that helps individuals, professionals, businesses and institutions manage services such as:" },
        { type: "list", items: ["Employment", "Professional services", "Housing", "Transport", "Appointment management"] },
        { type: "paragraph", text: "Additional products and services may be introduced in the future." },
      ] },
      { id: "scope", title: "3. Scope of This Policy", blocks: [
        { type: "paragraph", text: "This Privacy Policy applies to:" },
        { type: "list", items: ["the NIHILOBA website;", "SHIDA on WhatsApp;", "communication with our support team;", "future NIHILOBA digital services unless a separate privacy policy is provided."] },
      ] },
      { id: "information-we-collect", title: "4. Information We Collect", blocks: [
        { type: "paragraph", text: "The information collected depends on how you use SHIDA." },
        { type: "subsection", title: "4.1 Account Information", paragraphs: ["When creating an account, we may collect:"], items: ["Name", "WhatsApp phone number", "Preferred language", "Country", "City", "Profile type, such as personal, business or both"] },
        { type: "subsection", title: "4.2 Marketplace Information", paragraphs: ["Depending on the marketplace you use, SHIDA may collect additional information."] },
        { type: "subsection", title: "Employment", paragraphs: ["Examples include:"], items: ["Job title", "Professional description", "Employer information", "Salary or budget, if provided", "Application information"] },
        { type: "subsection", title: "Services", paragraphs: ["Examples include:"], items: ["Business or provider name", "Service categories", "Availability", "Appointment preferences", "Service descriptions"] },
        { type: "subsection", title: "Housing", paragraphs: ["Examples include:"], items: ["Property descriptions", "Rental information", "Visit requests", "General location"] },
        { type: "subsection", title: "Transport", paragraphs: ["Examples include:"], items: ["Departure", "Destination", "Journey information"] },
        { type: "subsection", title: "4.3 Support Requests", paragraphs: ["If you contact NIHILOBA Support, we may collect:"], items: ["Your support message", "Conversation history related to your request", "Information necessary to resolve the issue"] },
        { type: "subsection", title: "4.4 Technical Information", paragraphs: ["To operate SHIDA securely, limited technical information may be processed, such as:"], items: ["WhatsApp identifiers required by the WhatsApp Cloud API", "Platform event timestamps", "Basic technical logs used for troubleshooting and service reliability"] },
        { type: "paragraph", text: "We do not intentionally collect unnecessary technical information." },
      ] },
      { id: "information-not-collected", title: "5. Information We Do Not Intentionally Collect", blocks: [
        { type: "paragraph", text: "Unless required for a future feature that clearly explains why the information is needed, SHIDA does not intentionally collect:" },
        { type: "list", items: ["Passwords", "Credit or debit card information", "Banking credentials", "Biometric information", "Medical records", "Government identity documents", "Sensitive personal information unrelated to the requested service"] },
        { type: "paragraph", text: "If such information is accidentally shared with us, we may remove it where appropriate." },
      ] },
      { id: "how-we-use-information", title: "6. How We Use Your Information", blocks: [
        { type: "paragraph", text: "Your information is used to:" },
        { type: "list", items: ["create and manage your account;", "operate SHIDA’s marketplaces;", "match users with relevant opportunities or services;", "manage appointments and requests;", "provide customer support;", "improve the quality of our products;", "detect abuse or fraudulent activity;", "maintain platform security."] },
        { type: "paragraph", text: "We do not use personal information for unrelated purposes without informing users." },
      ] },
      { id: "privacy-protection", title: "7. How SHIDA Protects Your Privacy", blocks: [
        { type: "paragraph", text: "Protecting personal information is one of SHIDA’s design principles." },
        { type: "subsection", title: "Employment", paragraphs: ["Job applications are shared only with the employer to whom the candidate chooses to apply."] },
        { type: "subsection", title: "Services", paragraphs: ["Service providers receive only the information necessary to process a booking or service request."] },
        { type: "subsection", title: "Housing", paragraphs: ["Property owner phone numbers are not publicly displayed.", "Contact information is only shared when the housing workflow requires it, such as after a visit has been proposed and confirmed."] },
        { type: "subsection", title: "Transport", paragraphs: ["Only information necessary to organise the journey is exchanged between participants."] },
        { type: "subsection", title: "Churches", paragraphs: ["Pastoral appointment requests remain visible only to the relevant church account."] },
        { type: "subsection", title: "Schools", paragraphs: ["Information provided for school appointments is accessible only to the relevant school."] },
        { type: "subsection", title: "Public Institutions", paragraphs: ["Appointment information is intended to remain accessible only to authorised personnel responsible for the requested service."] },
      ] },
      { id: "sharing-information", title: "8. Sharing Information", blocks: [
        { type: "paragraph", text: "NIHILOBA does not sell personal information." },
        { type: "paragraph", text: "Information may be shared only when necessary to provide the requested service." },
        { type: "paragraph", text: "Examples include:" },
        { type: "list", items: ["submitting a job application;", "requesting a service;", "scheduling an appointment;", "arranging a housing visit;", "organising transport."] },
        { type: "paragraph", text: "We may also disclose information when required by applicable law or when necessary to protect the security and integrity of the platform." },
      ] },
      { id: "data-retention", title: "9. Data Retention", blocks: [
        { type: "paragraph", text: "We retain information only for as long as necessary to:" },
        { type: "list", items: ["operate SHIDA;", "comply with legal obligations;", "resolve disputes;", "prevent fraud;", "improve platform reliability."] },
        { type: "paragraph", text: "Users may request deletion of their personal information, subject to applicable legal or operational requirements." },
      ] },
      { id: "your-rights", title: "10. Your Rights", blocks: [
        { type: "paragraph", text: "Depending on applicable laws, you may have the right to:" },
        { type: "list", items: ["access your personal information;", "correct inaccurate information;", "request deletion;", "object to certain processing;", "request a copy of your information where applicable;", "withdraw consent where processing is based on consent."] },
        { type: "paragraph", text: "Requests may be submitted using the contact information provided below." },
      ] },
      { id: "privacy-by-design", title: "11. Privacy by Design", blocks: [
        { type: "paragraph", text: "Privacy is considered from the beginning of product development rather than added afterwards." },
        { type: "paragraph", text: "Whenever possible, SHIDA is designed to:" },
        { type: "list", items: ["minimise unnecessary data collection;", "limit information sharing to what is required for the requested service;", "separate public and private information;", "continuously improve privacy protections as new features are introduced."] },
      ] },
      { id: "international-use", title: "12. International Use", blocks: [
        { type: "paragraph", text: "Although SHIDA’s first use cases have focused on the Democratic Republic of the Congo, the platform is designed to operate internationally." },
        { type: "paragraph", text: "Privacy practices may evolve as NIHILOBA expands into additional countries while respecting applicable local laws." },
      ] },
      { id: "cookies", title: "13. Cookies and Website Data", blocks: [
        { type: "paragraph", text: "The NIHILOBA website may use limited cookies or similar technologies to:" },
        { type: "list", items: ["improve website performance;", "remember language preferences;", "understand general website usage if analytics are introduced."] },
        { type: "paragraph", text: "Users will be informed if additional cookie categories are implemented." },
      ] },
      { id: "children", title: "14. Children’s Privacy", blocks: [
        { type: "paragraph", text: "SHIDA is not intended for children to use independently where parental or legal guardian consent is required by applicable law." },
        { type: "paragraph", text: "Certain services, such as school-related appointments, may involve information submitted by parents or legal guardians on behalf of children." },
      ] },
      { id: "changes", title: "15. Changes to This Policy", blocks: [
        { type: "paragraph", text: "As SHIDA continues to evolve, this Privacy Policy may be updated." },
        { type: "paragraph", text: "The effective date at the top of this page will always indicate the latest version." },
        { type: "paragraph", text: "Where appropriate, significant changes will be communicated through the website or SHIDA." },
      ] },
      { id: "contact", title: "16. Contact", blocks: [
        { type: "paragraph", text: "If you have questions about this Privacy Policy or how your information is handled, you may contact us at:" },
        { type: "paragraph", text: `Email: ${CONTACT_EMAILS.privacy}` },
      ] },
    ],
    finalTitle: "Final Note",
    finalParagraphs: ["This Privacy Policy reflects the current design and operation of NIHILOBA and SHIDA. It is intended to explain our practices in clear language.", "As new products and features are introduced, this policy will be reviewed and updated so that it remains accurate, transparent and aligned with applicable privacy laws."],
    resourcesTitle: "Explore the Trust Center",
    resources: [
      { label: "GDPR & Data Protection", path: "/privacy#your-rights" },
      { label: "Security", path: "/security" },
      { label: "Terms of Use", path: "/terms" },
      { label: "Frequently Asked Questions", path: "/faq" },
      { label: "Acceptable Use Policy", path: "/acceptable-use" },
    ],
  },
  fr: {
    eyebrow: "Vie privée et protection des données",
    title: "Politique de confidentialité",
    effectiveDate: "Date d’entrée en vigueur : août 2026",
    sections: [
      { id: "introduction", title: "1. Introduction", blocks: [
        { type: "paragraph", text: "Bienvenue chez NIHILOBA." },
        { type: "paragraph", text: "La présente Politique de confidentialité explique comment NIHILOBA collecte, utilise, conserve et protège les données personnelles lorsque vous utilisez notre site internet, nos produits et nos services numériques, notamment SHIDA, notre plateforme accessible sur WhatsApp." },
        { type: "paragraph", text: "Chez NIHILOBA, nous considérons que la protection de la vie privée ne doit pas être ajoutée après la conception d’un produit. La protection des données personnelles fait partie intégrante de la manière dont nous concevons et développons nos solutions. Dans la mesure du possible, SHIDA est conçu pour collecter uniquement les informations nécessaires à la fourniture du service demandé." },
        { type: "paragraph", text: "En utilisant SHIDA ou le site internet de NIHILOBA, vous reconnaissez les pratiques décrites dans la présente Politique de confidentialité." },
      ] },
      { id: "who-we-are", title: "2. Qui sommes-nous ?", blocks: [
        { type: "paragraph", text: "NIHILOBA est une entreprise technologique qui développe des solutions numériques pratiques afin de simplifier l’accès aux services du quotidien." },
        { type: "paragraph", text: "Notre premier produit est SHIDA, une plateforme accessible sur WhatsApp qui aide les particuliers, les professionnels, les entreprises et les institutions à gérer différents services, notamment :" },
        { type: "list", items: ["L’emploi", "Les services professionnels", "Le logement", "Le transport", "La gestion des rendez-vous"] },
        { type: "paragraph", text: "D’autres produits et services pourront être introduits à l’avenir." },
      ] },
      { id: "scope", title: "3. Champ d’application de cette politique", blocks: [
        { type: "paragraph", text: "La présente Politique de confidentialité s’applique :" },
        { type: "list", items: ["au site internet de NIHILOBA ;", "à SHIDA sur WhatsApp ;", "aux communications avec notre équipe d’assistance ;", "aux futurs services numériques de NIHILOBA, sauf lorsqu’une politique distincte est fournie."] },
      ] },
      { id: "information-we-collect", title: "4. Informations que nous collectons", blocks: [
        { type: "paragraph", text: "Les informations collectées dépendent de la manière dont vous utilisez SHIDA." },
        { type: "subsection", title: "4.1 Informations relatives au compte", paragraphs: ["Lors de la création d’un compte, nous pouvons collecter :"], items: ["Votre nom", "Votre numéro de téléphone WhatsApp", "Votre langue préférée", "Votre pays", "Votre ville", "Votre type de profil, par exemple personnel, professionnel ou les deux"] },
        { type: "subsection", title: "4.2 Informations relatives aux marchés", paragraphs: ["Selon le marché que vous utilisez, SHIDA peut collecter des informations supplémentaires."] },
        { type: "subsection", title: "Emploi", paragraphs: ["Ces informations peuvent notamment comprendre :"], items: ["L’intitulé du poste", "La description professionnelle", "Les informations relatives à l’employeur", "Le salaire ou le budget, lorsqu’il est fourni", "Les informations relatives aux candidatures"] },
        { type: "subsection", title: "Services", paragraphs: ["Ces informations peuvent notamment comprendre :"], items: ["Le nom de l’entreprise ou du professionnel", "Les catégories de services", "Les disponibilités", "Les préférences de rendez-vous", "Les descriptions des services"] },
        { type: "subsection", title: "Logement", paragraphs: ["Ces informations peuvent notamment comprendre :"], items: ["La description du logement", "Les informations relatives au loyer", "Les demandes de visite", "La localisation générale"] },
        { type: "subsection", title: "Transport", paragraphs: ["Ces informations peuvent notamment comprendre :"], items: ["Le lieu de départ", "La destination", "Les informations relatives au trajet"] },
        { type: "subsection", title: "4.3 Demandes d’assistance", paragraphs: ["Lorsque vous contactez l’assistance NIHILOBA, nous pouvons collecter :"], items: ["Votre message d’assistance", "L’historique de la conversation lié à votre demande", "Les informations nécessaires pour résoudre le problème"] },
        { type: "subsection", title: "4.4 Informations techniques", paragraphs: ["Afin d’assurer le fonctionnement et la sécurité de SHIDA, certaines informations techniques limitées peuvent être traitées, notamment :"], items: ["Les identifiants WhatsApp nécessaires au fonctionnement de l’API WhatsApp Cloud", "Les horodatages des événements de la plateforme", "Les journaux techniques de base utilisés pour le diagnostic et la fiabilité du service"] },
        { type: "paragraph", text: "Nous ne collectons pas intentionnellement d’informations techniques inutiles." },
      ] },
      { id: "information-not-collected", title: "5. Informations que nous ne collectons pas intentionnellement", blocks: [
        { type: "paragraph", text: "Sauf lorsqu’une future fonctionnalité explique clairement pourquoi une information est nécessaire, SHIDA ne collecte pas intentionnellement :" },
        { type: "list", items: ["Les mots de passe", "Les informations relatives aux cartes de crédit ou de débit", "Les identifiants bancaires", "Les données biométriques", "Les dossiers médicaux", "Les documents officiels d’identité", "Les données sensibles sans rapport avec le service demandé"] },
        { type: "paragraph", text: "Lorsque de telles informations nous sont communiquées accidentellement, nous pouvons les supprimer lorsque cela est approprié." },
      ] },
      { id: "how-we-use-information", title: "6. Comment nous utilisons vos informations", blocks: [
        { type: "paragraph", text: "Vos informations peuvent être utilisées afin de :" },
        { type: "list", items: ["créer et gérer votre compte ;", "faire fonctionner les différents marchés de SHIDA ;", "mettre les utilisateurs en relation avec des opportunités ou des services pertinents ;", "gérer les rendez-vous et les demandes ;", "fournir une assistance aux utilisateurs ;", "améliorer la qualité de nos produits ;", "détecter les abus ou les activités frauduleuses ;", "maintenir la sécurité de la plateforme."] },
        { type: "paragraph", text: "Nous n’utilisons pas les données personnelles à des fins sans rapport avec leur collecte sans en informer les utilisateurs." },
      ] },
      { id: "privacy-protection", title: "7. Comment SHIDA protège votre vie privée", blocks: [
        { type: "paragraph", text: "La protection des données personnelles constitue l’un des principes de conception de SHIDA." },
        { type: "subsection", title: "Emploi", paragraphs: ["Les informations relatives à une candidature sont uniquement communiquées à l’employeur auprès duquel le candidat choisit de postuler."] },
        { type: "subsection", title: "Services", paragraphs: ["Les professionnels reçoivent uniquement les informations nécessaires au traitement d’une réservation ou d’une demande de service."] },
        { type: "subsection", title: "Logement", paragraphs: ["Les numéros de téléphone des propriétaires ne sont pas affichés publiquement.", "Les coordonnées sont uniquement partagées lorsque le processus lié au logement le nécessite, notamment après qu’une visite a été proposée et confirmée."] },
        { type: "subsection", title: "Transport", paragraphs: ["Seules les informations nécessaires à l’organisation du trajet sont échangées entre les participants."] },
        { type: "subsection", title: "Églises", paragraphs: ["Les demandes de rendez-vous pastoral restent accessibles uniquement au compte de l’église concernée."] },
        { type: "subsection", title: "Écoles", paragraphs: ["Les informations fournies pour les rendez-vous scolaires sont accessibles uniquement à l’école concernée."] },
        { type: "subsection", title: "Institutions publiques", paragraphs: ["Les informations relatives aux rendez-vous sont destinées à rester accessibles uniquement au personnel autorisé chargé du service demandé."] },
      ] },
      { id: "sharing-information", title: "8. Partage des informations", blocks: [
        { type: "paragraph", text: "NIHILOBA ne vend pas les données personnelles." },
        { type: "paragraph", text: "Les informations peuvent être partagées uniquement lorsque cela est nécessaire à la fourniture du service demandé." },
        { type: "paragraph", text: "Cela peut notamment concerner :" },
        { type: "list", items: ["l’envoi d’une candidature ;", "la demande d’un service ;", "la prise d’un rendez-vous ;", "l’organisation d’une visite de logement ;", "l’organisation d’un trajet."] },
        { type: "paragraph", text: "Nous pouvons également communiquer certaines informations lorsque la loi applicable l’exige ou lorsque cela est nécessaire pour protéger la sécurité et l’intégrité de la plateforme." },
      ] },
      { id: "data-retention", title: "9. Conservation des données", blocks: [
        { type: "paragraph", text: "Nous conservons les informations uniquement pendant la durée nécessaire afin de :" },
        { type: "list", items: ["faire fonctionner SHIDA ;", "respecter les obligations légales applicables ;", "résoudre les litiges ;", "prévenir la fraude ;", "améliorer la fiabilité de la plateforme."] },
        { type: "paragraph", text: "Les utilisateurs peuvent demander la suppression de leurs données personnelles, sous réserve des obligations légales ou opérationnelles applicables." },
      ] },
      { id: "your-rights", title: "10. Vos droits", blocks: [
        { type: "paragraph", text: "Selon les lois applicables, vous pouvez disposer du droit de :" },
        { type: "list", items: ["demander l’accès à vos données personnelles ;", "corriger des informations inexactes ;", "demander la suppression de vos données ;", "vous opposer à certains traitements ;", "demander une copie de vos informations lorsque cela est applicable ;", "retirer votre consentement lorsque le traitement repose sur celui-ci."] },
        { type: "paragraph", text: "Les demandes peuvent être envoyées en utilisant les coordonnées indiquées ci-dessous." },
      ] },
      { id: "privacy-by-design", title: "11. Protection de la vie privée dès la conception", blocks: [
        { type: "paragraph", text: "La protection de la vie privée est prise en compte dès le début du développement du produit." },
        { type: "paragraph", text: "Dans la mesure du possible, SHIDA est conçu pour :" },
        { type: "list", items: ["réduire la collecte d’informations inutiles ;", "limiter le partage aux informations nécessaires au service demandé ;", "séparer les informations publiques des informations privées ;", "améliorer continuellement les protections lors de l’introduction de nouvelles fonctionnalités."] },
      ] },
      { id: "international-use", title: "12. Utilisation internationale", blocks: [
        { type: "paragraph", text: "Bien que les premiers cas d’utilisation de SHIDA se soient concentrés sur la République démocratique du Congo, la plateforme est conçue pour fonctionner à l’échelle internationale." },
        { type: "paragraph", text: "Les pratiques relatives à la protection des données pourront évoluer à mesure que NIHILOBA se développe dans d’autres pays, dans le respect des lois locales applicables." },
      ] },
      { id: "cookies", title: "13. Cookies et données du site internet", blocks: [
        { type: "paragraph", text: "Le site internet de NIHILOBA peut utiliser un nombre limité de cookies ou de technologies similaires afin de :" },
        { type: "list", items: ["améliorer les performances du site ;", "mémoriser les préférences linguistiques ;", "comprendre l’utilisation générale du site si des outils d’analyse sont introduits."] },
        { type: "paragraph", text: "Les utilisateurs seront informés si d’autres catégories de cookies sont mises en place." },
      ] },
      { id: "children", title: "14. Protection des données des enfants", blocks: [
        { type: "paragraph", text: "SHIDA n’est pas destiné à être utilisé de manière indépendante par des enfants lorsque le consentement d’un parent ou d’un représentant légal est requis par la loi applicable." },
        { type: "paragraph", text: "Certains services, notamment les rendez-vous scolaires, peuvent impliquer des informations communiquées par des parents ou des représentants légaux au nom d’un enfant." },
      ] },
      { id: "changes", title: "15. Modifications de cette politique", blocks: [
        { type: "paragraph", text: "La présente Politique de confidentialité pourra être mise à jour à mesure que SHIDA évolue." },
        { type: "paragraph", text: "La date d’entrée en vigueur indiquée en haut de cette page correspondra toujours à la version la plus récente." },
        { type: "paragraph", text: "Lorsque cela est approprié, les modifications importantes seront communiquées par l’intermédiaire du site internet ou de SHIDA." },
      ] },
      { id: "contact", title: "16. Contact", blocks: [
        { type: "paragraph", text: "Pour toute question concernant cette Politique de confidentialité ou le traitement de vos informations, vous pouvez nous contacter à l’adresse suivante :" },
        { type: "paragraph", text: `E-mail : ${CONTACT_EMAILS.privacy}` },
      ] },
    ],
    finalTitle: "Note finale",
    finalParagraphs: ["La présente Politique de confidentialité reflète la conception et le fonctionnement actuels de NIHILOBA et de SHIDA. Elle a pour objectif d’expliquer nos pratiques dans un langage clair.", "À mesure que de nouveaux produits et de nouvelles fonctionnalités seront introduits, cette politique sera révisée et mise à jour afin de rester exacte, transparente et conforme aux lois applicables en matière de protection des données."],
    resourcesTitle: "Explorer le Centre de confiance",
    resources: [
      { label: "RGPD et protection des données", path: "/privacy#your-rights" },
      { label: "Sécurité", path: "/securite" },
      { label: "Conditions d’utilisation", path: "/conditions-utilisation" },
      { label: "Questions fréquentes", path: "/faq" },
      { label: "Politique d’utilisation acceptable", path: "/utilisation-acceptable" },
    ],
  },
};

function PolicyBlockView({ block }: { block: PolicyBlock }) {
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "list") return <LegalList items={block.items}/>;
  return (
    <div className="policy-subsection">
      <h3>{block.title}</h3>
      {block.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {block.items && <LegalList items={block.items}/>} 
    </div>
  );
}

export function PrivacyPolicyPage({ locale }: { locale: Locale }) {
  const content = policy[locale];
  const toc=content.sections.map(({id,title})=>({id,label:title.replace(/^\d+\.\s*/,"")}));
  return (
    <LegalPage locale={locale} eyebrow={locale==="en"?"Trust Center":"Centre de confiance"} title={content.title} updated={content.effectiveDate} readingTime={locale==="en"?"7 min read":"7 min de lecture"} toc={toc} related={false}>
      {content.sections.map((section)=><LegalSection id={section.id} title={section.title} key={section.id}>{section.blocks.map((block,index)=><PolicyBlockView block={block} key={`${section.id}-${index}`}/>)}</LegalSection>)}
      <LegalSection id="final-note" title={content.finalTitle}>{content.finalParagraphs.map((paragraph)=><p key={paragraph}>{paragraph}</p>)}</LegalSection>
      <LegalRelatedLinks locale={locale} current="privacy" />
    </LegalPage>
  );
}
