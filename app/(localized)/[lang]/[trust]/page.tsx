import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DataProtectionPage } from "../../../components/pages/data-protection-page";
import { SecurityPage } from "../../../components/pages/security-page";
import { TermsOfUsePage } from "../../../components/pages/terms-of-use-page";
import { AcceptableUsePage, FaqPage, TrustCenterPage } from "../../../components/pages/trust-center-pages";
import { isLocale } from "../../../lib/i18n";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return params.lang === "fr"
    ? [{ trust: "protection-des-donnees" }, { trust: "securite" }, { trust: "conditions-utilisation" }, { trust: "faq" }, { trust: "utilisation-acceptable" }, { trust: "confiance" }]
    : [{ trust: "data-protection" }, { trust: "security" }, { trust: "terms" }, { trust: "faq" }, { trust: "acceptable-use" }, { trust: "trust" }];
}

function validRoute(lang:string,trust:string) {
  return (lang==="en"&&["data-protection","security","terms","faq","acceptable-use","trust"].includes(trust))||(lang==="fr"&&["protection-des-donnees","securite","conditions-utilisation","faq","utilisation-acceptable","confiance"].includes(trust));
}

export async function generateMetadata({params}:{params:Promise<{lang:string;trust:string}>}):Promise<Metadata> {
  const {lang,trust}=await params;
  if(!validRoute(lang,trust)) return {};
  const french=lang==="fr";
  const key = trust === "protection-des-donnees" ? "data-protection" : trust === "securite" ? "security" : trust === "conditions-utilisation" ? "terms" : trust === "utilisation-acceptable" ? "acceptable-use" : trust === "confiance" ? "trust" : trust;
  const pages: Record<string,{title:string;description:string;en:string;fr:string}> = {
    "data-protection": {title:french?"Protection des données et vie privée":"Data Protection & Privacy",description:french?"Découvrez comment NIHILOBA applique la protection de la vie privée dès la conception, la minimisation des données et des principes reconnus de protection des données dans le développement de SHIDA.":"Learn how NIHILOBA applies privacy by design, data minimisation and recognised data protection principles when developing SHIDA.",en:"/en/data-protection",fr:"/fr/protection-des-donnees"},
    security: {title:french?"Sécurité":"Security",description:french?"Découvrez comment NIHILOBA protège SHIDA, ses utilisateurs et ses services grâce à une approche de sécurité intégrée au développement.":"Learn how NIHILOBA approaches application security, secure development and responsible protection of user information.",en:"/en/security",fr:"/fr/securite"},
    terms: {title:french?"Conditions d’utilisation":"Terms of Use",description:french?"Consultez les Conditions d’utilisation applicables au site NIHILOBA, à SHIDA et aux futurs services numériques.":"Read the Terms of Use governing access to NIHILOBA, SHIDA and future digital services.",en:"/en/terms",fr:"/fr/conditions-utilisation"},
    faq: {title:french?"Questions fréquentes":"Frequently Asked Questions",description:french?"Trouvez des réponses aux questions fréquentes concernant NIHILOBA, SHIDA, la confidentialité et la sécurité.":"Find answers to common questions about NIHILOBA, SHIDA, privacy and security.",en:"/en/faq",fr:"/fr/faq"},
    "acceptable-use": {title:french?"Politique d’utilisation acceptable":"Acceptable Use Policy",description:french?"Consultez les règles d’utilisation responsable du site NIHILOBA et de SHIDA.":"Read the standards for responsible use of the NIHILOBA website and SHIDA.",en:"/en/acceptable-use",fr:"/fr/utilisation-acceptable"},
    trust: {title:french?"Centre de confiance":"Trust Center",description:french?"Découvrez l’approche de NIHILOBA en matière de confidentialité, de protection des données, de sécurité, d’utilisation responsable et de transparence.":"Explore NIHILOBA’s approach to privacy, data protection, security, responsible platform use and transparency.",en:"/en/trust",fr:"/fr/confiance"},
  };
  const page=pages[key];
  const canonical=french?page.fr:page.en;
  const title=page.title;
  const description=page.description;
  const languages={en:page.en,fr:page.fr,"x-default":page.en};
  return {
    title,
    description,
    alternates:{canonical,languages},
    openGraph:{url:canonical,locale:french?"fr_FR":"en_US",title:`${title} | NIHILOBA`,description,images:["https://nihiloba.com/NIHILOBA_logo.png"]},
  };
}

export default async function Page({params}:{params:Promise<{lang:string;trust:string}>}) {
  const {lang,trust}=await params;
  if(!isLocale(lang)||!validRoute(lang,trust)) notFound();
  if(trust==="trust"||trust==="confiance") return <TrustCenterPage locale={lang}/>;
  if(trust==="faq") return <FaqPage locale={lang}/>;
  if(trust==="acceptable-use"||trust==="utilisation-acceptable") return <AcceptableUsePage locale={lang}/>;
  if(trust==="terms"||trust==="conditions-utilisation") return <TermsOfUsePage locale={lang}/>;
  return trust==="security"||trust==="securite"?<SecurityPage locale={lang}/>:<DataProtectionPage locale={lang}/>;
}
