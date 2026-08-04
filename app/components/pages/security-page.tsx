import type { Locale } from "../../lib/i18n";
import {
  LegalCallout,
  LegalList,
  LegalPage,
  LegalRelatedLinks,
  LegalSection,
} from "../legal/legal-document";

type Section = {
  id: string;
  title: string;
  paragraphs: readonly string[];
  items?: readonly string[];
  after?: readonly string[];
  callout?: boolean;
};

const content: Record<Locale, {
  title: string;
  updated: string;
  readingTime: string;
  sections: readonly Section[];
}> = {
  en: {
    title: "Security",
    updated: "Effective date: August 2026",
    readingTime: "5 min read",
    sections: [
      { id: "our-approach", title: "Our Approach", paragraphs: ["Security is an essential part of how NIHILOBA designs and develops its products.", "Every day, individuals, professionals, businesses and institutions trust SHIDA to help manage appointments, services, employment opportunities and other important interactions. Protecting that trust is one of our highest priorities.", "Rather than treating security as a single feature, we view it as a continuous process that evolves alongside the platform."] },
      { id: "secure-by-design", title: "Secure by Design", paragraphs: ["Security is considered throughout the development of SHIDA.", "Whenever new features are introduced, we evaluate how they may affect the confidentiality, integrity and availability of user information.", "Examples include:"], items: ["reducing unnecessary exposure of personal information;", "limiting access to operational data;", "reviewing new workflows before they are introduced;", "continuously improving platform architecture."] },
      { id: "secure-communication", title: "Secure Communication", paragraphs: ["Communication between users, our website and supported services is protected using modern HTTPS encryption.", "Encrypted connections help reduce the risk of information being intercepted while it is transmitted across the internet.", "Whenever possible, secure communication is used throughout the NIHILOBA platform."] },
      { id: "hosting-infrastructure", title: "Hosting Infrastructure", paragraphs: ["SHIDA is hosted using modern cloud infrastructure designed for reliability and security.", "Hosting providers maintain physical infrastructure, networking and availability, while NIHILOBA remains responsible for the security of the application itself.", "As the platform grows, infrastructure may evolve to support new requirements while maintaining strong security practices."] },
      { id: "access-control", title: "Access Control", paragraphs: ["Administrative functions are restricted to authorised personnel.", "Access is granted only when necessary for operational responsibilities.", "NIHILOBA follows the principle of providing only the level of access required to perform a specific task.", "This helps reduce unnecessary exposure of sensitive information."] },
      { id: "application-security", title: "Application Security", paragraphs: ["Security is considered throughout the software development process.", "Examples include:"], items: ["reviewing new features before deployment;", "correcting identified vulnerabilities;", "maintaining software dependencies;", "improving application architecture over time;", "monitoring system behaviour where appropriate."], after: ["Security improvements continue throughout the life of the platform."] },
      { id: "protecting-personal-information", title: "Protecting Personal Information", paragraphs: ["Security and privacy work together.", "SHIDA is designed to minimise unnecessary collection and sharing of personal information.", "Examples include:"], items: ["phone numbers are not publicly displayed by default;", "information is shared only when required by a workflow;", "appointment information remains visible only to the relevant participants;", "access to operational information is restricted where appropriate."], after: ["Further details are available in our Privacy Policy."] },
      { id: "user-responsibility", title: "User Responsibility", paragraphs: ["Security is a shared responsibility.", "Users can help protect their accounts by:"], items: ["keeping control of their WhatsApp account;", "protecting their mobile device;", "avoiding sharing verification codes or sensitive credentials;", "reporting suspicious activity;", "reviewing information before submitting requests."] },
      { id: "reporting-security-issues", title: "Reporting Security Issues", paragraphs: ["If you believe you have discovered a security issue affecting NIHILOBA or SHIDA, we encourage responsible disclosure.", "Please contact us before publicly disclosing any vulnerability so that we have the opportunity to investigate and resolve the issue.", "Security reports may currently be sent to:", "shida.nihiloba@gmail.com", "A dedicated security contact under @nihiloba.com will be introduced as NIHILOBA continues to grow."] },
      { id: "continuous-improvement", title: "Continuous Improvement", paragraphs: ["Technology evolves continuously, and so do security risks.", "For this reason, NIHILOBA regularly reviews its architecture, infrastructure and development practices.", "New security measures may be introduced as SHIDA expands with additional products, marketplaces and business features.", "Security is an ongoing commitment rather than a one-time objective."] },
      { id: "important-notice", title: "Important Notice", paragraphs: ["NIHILOBA is committed to applying recognised security practices throughout the development of SHIDA.", "However, unless explicitly stated, NIHILOBA does not claim certification under standards such as:"], items: ["ISO 27001", "SOC 2", "PCI DSS"], after: ["or any other external certification.", "Should formal certifications be obtained in the future, this page will be updated accordingly."], callout: true },
      { id: "contact", title: "Contact", paragraphs: ["Questions regarding security may be sent to:", "Email", "shida.nihiloba@gmail.com", "A dedicated security email address under @nihiloba.com will be introduced as NIHILOBA continues to grow."] },
      { id: "closing-statement", title: "Closing Statement", paragraphs: ["Trust is earned through consistent actions rather than promises.", "NIHILOBA is committed to building products that remain secure, reliable and respectful of the people and organisations that choose to use them.", "As SHIDA continues to evolve, security will remain a core part of every stage of product development."] },
    ],
  },
  fr: {
    title: "Sécurité",
    updated: "Date d’entrée en vigueur : août 2026",
    readingTime: "5 min de lecture",
    sections: [
      { id: "notre-approche", title: "Notre approche", paragraphs: ["La sécurité est un élément essentiel de la manière dont NIHILOBA conçoit et développe ses produits.", "Chaque jour, des particuliers, des professionnels, des entreprises et des institutions font confiance à SHIDA pour les aider à gérer des rendez-vous, des services, des opportunités d’emploi et d’autres interactions importantes. Protéger cette confiance constitue l’une de nos plus grandes priorités.", "Plutôt que de considérer la sécurité comme une fonctionnalité isolée, nous la concevons comme un processus continu qui évolue avec la plateforme."] },
      { id: "securite-des-la-conception", title: "Sécurité dès la conception", paragraphs: ["La sécurité est prise en compte tout au long du développement de SHIDA.", "Lors de l’introduction de nouvelles fonctionnalités, nous évaluons la manière dont elles peuvent affecter la confidentialité, l’intégrité et la disponibilité des informations des utilisateurs.", "Cela peut notamment inclure :"], items: ["la réduction de l’exposition inutile des données personnelles ;", "la limitation de l’accès aux données opérationnelles ;", "l’examen des nouveaux processus avant leur introduction ;", "l’amélioration continue de l’architecture de la plateforme."] },
      { id: "communications-securisees", title: "Communications sécurisées", paragraphs: ["Les communications entre les utilisateurs, notre site internet et les services pris en charge sont protégées au moyen d’un chiffrement HTTPS moderne.", "Les connexions chiffrées contribuent à réduire le risque d’interception des informations lors de leur transmission sur internet.", "Dans la mesure du possible, des communications sécurisées sont utilisées sur l’ensemble de la plateforme NIHILOBA."] },
      { id: "infrastructure-hebergement", title: "Infrastructure d’hébergement", paragraphs: ["SHIDA est hébergé au moyen d’une infrastructure cloud moderne conçue pour la fiabilité et la sécurité.", "Les fournisseurs d’hébergement assurent la maintenance de l’infrastructure physique, du réseau et de la disponibilité, tandis que NIHILOBA demeure responsable de la sécurité de l’application elle-même.", "À mesure que la plateforme se développe, l’infrastructure pourra évoluer afin de répondre à de nouvelles exigences tout en maintenant de solides pratiques de sécurité."] },
      { id: "controle-acces", title: "Contrôle d’accès", paragraphs: ["Les fonctions administratives sont réservées au personnel autorisé.", "L’accès est accordé uniquement lorsqu’il est nécessaire à l’exercice de responsabilités opérationnelles.", "NIHILOBA applique le principe consistant à fournir uniquement le niveau d’accès requis pour accomplir une tâche précise.", "Cette approche contribue à réduire l’exposition inutile des informations sensibles."] },
      { id: "securite-application", title: "Sécurité de l’application", paragraphs: ["La sécurité est prise en compte tout au long du processus de développement logiciel.", "Cela peut notamment inclure :"], items: ["l’examen des nouvelles fonctionnalités avant leur mise en production ;", "la correction des vulnérabilités identifiées ;", "la maintenance des dépendances logicielles ;", "l’amélioration progressive de l’architecture de l’application ;", "la surveillance du comportement du système lorsque cela est approprié."], after: ["Les améliorations de sécurité se poursuivent pendant toute la durée de vie de la plateforme."] },
      { id: "protection-donnees-personnelles", title: "Protection des données personnelles", paragraphs: ["La sécurité et la protection de la vie privée vont de pair.", "SHIDA est conçu pour réduire au minimum la collecte et le partage inutiles de données personnelles.", "Cela peut notamment inclure :"], items: ["les numéros de téléphone ne sont pas affichés publiquement par défaut ;", "les informations sont partagées uniquement lorsqu’un processus l’exige ;", "les informations relatives aux rendez-vous restent visibles uniquement par les participants concernés ;", "l’accès aux informations opérationnelles est limité lorsque cela est approprié."], after: ["De plus amples informations figurent dans notre Politique de confidentialité."] },
      { id: "responsabilite-utilisateurs", title: "Responsabilité des utilisateurs", paragraphs: ["La sécurité est une responsabilité partagée.", "Les utilisateurs peuvent contribuer à protéger leurs comptes en :"], items: ["gardant le contrôle de leur compte WhatsApp ;", "protégeant leur appareil mobile ;", "évitant de partager des codes de vérification ou des identifiants sensibles ;", "signalant toute activité suspecte ;", "vérifiant les informations avant d’envoyer une demande."] },
      { id: "signalement-problemes-securite", title: "Signalement des problèmes de sécurité", paragraphs: ["Si vous pensez avoir découvert un problème de sécurité affectant NIHILOBA ou SHIDA, nous vous encourageons à le signaler de manière responsable.", "Veuillez nous contacter avant de divulguer publiquement une vulnérabilité afin de nous donner la possibilité de l’examiner et de la corriger.", "Les signalements de sécurité peuvent actuellement être envoyés à :", "shida.nihiloba@gmail.com", "Une adresse de contact dédiée à la sécurité sous le domaine @nihiloba.com sera introduite à mesure que NIHILOBA se développe."] },
      { id: "amelioration-continue", title: "Amélioration continue", paragraphs: ["La technologie évolue en permanence, tout comme les risques de sécurité.", "Pour cette raison, NIHILOBA examine régulièrement son architecture, son infrastructure et ses pratiques de développement.", "De nouvelles mesures de sécurité pourront être introduites à mesure que SHIDA s’enrichit de produits, de marchés et de fonctionnalités professionnelles supplémentaires.", "La sécurité constitue un engagement permanent et non un objectif ponctuel."] },
      { id: "avis-important", title: "Avis important", paragraphs: ["NIHILOBA s’engage à appliquer des pratiques de sécurité reconnues tout au long du développement de SHIDA.", "Toutefois, sauf indication explicite, NIHILOBA ne revendique aucune certification au titre de normes telles que :"], items: ["ISO 27001", "SOC 2", "PCI DSS"], after: ["ni aucune autre certification externe.", "Si des certifications formelles sont obtenues à l’avenir, cette page sera mise à jour en conséquence."], callout: true },
      { id: "contact", title: "Contact", paragraphs: ["Pour toute question relative à la sécurité, vous pouvez nous écrire à :", "E-mail", "shida.nihiloba@gmail.com", "Une adresse e-mail dédiée à la sécurité sous le domaine @nihiloba.com sera introduite à mesure que NIHILOBA se développe."] },
      { id: "declaration-finale", title: "Déclaration finale", paragraphs: ["La confiance se gagne par des actions constantes plutôt que par des promesses.", "NIHILOBA s’engage à concevoir des produits qui restent sécurisés, fiables et respectueux des personnes et des organisations qui choisissent de les utiliser.", "À mesure que SHIDA continue d’évoluer, la sécurité demeurera au cœur de chaque étape du développement du produit."] },
    ],
  },
};

export function SecurityPage({ locale }: { locale: Locale }) {
  const page = content[locale];
  const toc = page.sections.map(({ id, title }) => ({ id, label: title }));

  return (
    <LegalPage locale={locale} eyebrow={locale === "en" ? "Trust centre" : "Centre de confiance"} title={page.title} updated={page.updated} readingTime={page.readingTime} toc={toc} related={false}>
      {page.sections.map((section) => {
        const body = <>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.items && <LegalList items={section.items} />}{section.after?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</>;
        return <LegalSection id={section.id} title={section.title} key={section.id}>{section.callout ? <LegalCallout label={section.title}>{body}</LegalCallout> : body}</LegalSection>;
      })}
      <LegalRelatedLinks locale={locale} current="security" />
    </LegalPage>
  );
}
