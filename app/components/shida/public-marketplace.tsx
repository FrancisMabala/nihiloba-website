import Image from "next/image";
import { ButtonLink } from "../button-link";
import "./public-marketplace.css";

type HeroProps = {
  eyebrow: string; title: string; intro: string; image: string; imageAlt: string;
  badge: string; browse: string; href: string; className?: string; imageClassName?: string; unoptimized?: boolean;
};

/** The same public discovery header for every SHIDA marketplace. */
export function PublicMarketplaceHero({eyebrow,title,intro,image,imageAlt,badge,browse,href,className="",imageClassName="",unoptimized=false}: HeroProps) {
  return <header className={`mp-hero ${className}`}>
    <div><p className="mp-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="mp-intro">{intro}</p><a className="mp-browse" href={href}>{browse}<span aria-hidden="true">↓</span></a></div>
    <div className={`mp-art ${imageClassName}`}><Image src={image} alt={imageAlt} fill unoptimized={unoptimized} sizes="(max-width: 700px) calc(100vw - 32px), (max-width: 1200px) 42vw, 500px" preload/><span aria-hidden="true">{badge}</span></div>
  </header>;
}

export type MarketplaceClosingCopy = {
  how: string; howIntro: string; invitation: string; invitationIntro: string; action: string;
};

export function PublicMarketplaceClosing({copy,badge,href}: {copy:MarketplaceClosingCopy;badge:string;href:string}) {
  return <><section className="mp-how"><h2>{copy.how}</h2><p>{copy.howIntro}</p></section>
    <section className="mp-invitation"><div><p className="mp-eyebrow">{badge}</p><h2>{copy.invitation}</h2><p>{copy.invitationIntro}</p></div><ButtonLink href={href}>{copy.action}</ButtonLink></section></>;
}
