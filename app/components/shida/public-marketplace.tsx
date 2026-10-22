import { ButtonLink } from "../button-link";
import "./public-marketplace.css";

/** Compact collection heading; useful listing photography belongs in results. */
export function MarketplaceDiscoveryHeader({title,intro,className="",primaryAction}: {
  title:string; intro:string; className?:string; primaryAction?:{label:string;href:string};
}) {
  return <header className={`mp-discovery-header ${className}`}><div><h1>{title}</h1><p>{intro}</p></div>
    {primaryAction&&<ButtonLink href={primaryAction.href} variant="secondary">{primaryAction.label}</ButtonLink>}
  </header>;
}

export type MarketplaceClosingCopy = {
  how: string; howIntro: string; invitation: string; invitationIntro: string; action: string;
};

export function PublicMarketplaceClosing({copy,badge,href}: {copy:MarketplaceClosingCopy;badge:string;href:string}) {
  return <><section className="mp-how"><h2>{copy.how}</h2><p>{copy.howIntro}</p></section>
    <section className="mp-invitation"><div><p className="mp-eyebrow">{badge}</p><h2>{copy.invitation}</h2><p>{copy.invitationIntro}</p></div><ButtonLink href={href}>{copy.action}</ButtonLink></section></>;
}
