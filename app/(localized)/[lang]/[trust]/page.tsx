import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DataProtectionPage } from "../../../components/pages/data-protection-page";
import { SecurityPage } from "../../../components/pages/security-page";
import { isLocale } from "../../../lib/i18n";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return params.lang === "fr"
    ? [{ trust: "protection-des-donnees" }, { trust: "securite" }]
    : [{ trust: "data-protection" }, { trust: "security" }];
}

function validRoute(lang:string,trust:string) {
  return (lang==="en"&&(trust==="data-protection"||trust==="security"))||(lang==="fr"&&(trust==="protection-des-donnees"||trust==="securite"));
}

export async function generateMetadata({params}:{params:Promise<{lang:string;trust:string}>}):Promise<Metadata> {
  const {lang,trust}=await params;
  if(!validRoute(lang,trust)) return {};
  const french=lang==="fr";
  const security=trust==="security"||trust==="securite";
  const canonical=security?(french?"/fr/securite":"/en/security"):(french?"/fr/protection-des-donnees":"/en/data-protection");
  const title=security?(french?"Sécurité":"Security"):(french?"Protection des données et vie privée":"Data Protection & Privacy");
  const description=security
    ? (french?"Découvrez comment NIHILOBA protège SHIDA, ses utilisateurs et ses services grâce à une approche de sécurité intégrée au développement.":"Learn how NIHILOBA approaches application security, secure development and responsible protection of user information.")
    : (french?"Découvrez comment NIHILOBA applique la protection de la vie privée dès la conception, la minimisation des données et des principes reconnus de protection des données dans le développement de SHIDA.":"Learn how NIHILOBA applies privacy by design, data minimisation and recognised data protection principles when developing SHIDA.");
  const languages=security?{en:"/en/security",fr:"/fr/securite","x-default":"/en/security"}:{en:"/en/data-protection",fr:"/fr/protection-des-donnees","x-default":"/en/data-protection"};
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
  return trust==="security"||trust==="securite"?<SecurityPage locale={lang}/>:<DataProtectionPage locale={lang}/>;
}
