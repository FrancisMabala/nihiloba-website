import {renderToStaticMarkup} from "react-dom/server";
import Link from "next/link";
import {expect,it,vi} from "vitest";
import {HomePage} from "../app/components/pages/home-page";
import {MarketplaceWelcome} from "../app/components/shida/marketplace-welcome";
import {WenzeSellingInvitations} from "../app/components/shida/wenze-selling-invitations";
import {OFFICIAL_CHANNELS} from "../app/lib/brand";

vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn()})}));

it.each(["en","fr"] as const)("keeps every %s homepage marketplace in the current tab and WhatsApp external",locale=>{
 const html=renderToStaticMarkup(<HomePage locale={locale}/>);
 const marketSection=html.slice(html.indexOf('<ul class="home-markets">')).split("</ul>")[0];
 const anchors=marketSection.match(/<a\b[^>]*>/g)??[];
 expect(anchors).toHaveLength(7);
 const prefix=locale==="en"?"":`/${locale}`;
 for(const [index,market] of ["emplois","services","wenze","appartements","hotels","restaurants","transport"].entries()){
  expect(anchors[index]).toContain(`href="${prefix}/shida/${market}`);
  expect(anchors[index]).not.toContain('target="_blank"');
 }
 const whatsapp=(html.match(/<a\b[^>]*>/g)??[]).find(anchor=>anchor.includes(`href="${OFFICIAL_CHANNELS.whatsapp}"`));
 expect(whatsapp).toContain('target="_blank"');
 expect(whatsapp).toContain('rel="noopener noreferrer"');
});

const emptyCopy={
 en:{generic:"No listings are available yet.",wenze:"There are no items for sale here yet. Have something to sell?",shops:"There are no shops here yet. Would you like to open yours?",welcome:"Welcome to Wenze!"},
 fr:{generic:"Aucune annonce disponible pour le moment.",wenze:"Il n’y a pas encore d’articles en vente ici. Vous avez quelque chose à vendre ?",shops:"Il n’y a pas encore de boutiques ici. Voulez-vous ouvrir la vôtre ?",welcome:"Bienvenue sur Wenze !"},
 ln:{generic:"Piblisite ezali naino te awa.",wenze:"Eloko ya kotɛka ezali naino te awa. Ozali na eloko ya kotɛka?",shops:"Butiki ezali naino te awa. Olingi kofungola oyo ya yo?",welcome:"Boyei malamu na Wenze!"},
 sw:{generic:"Bado hakuna matangazo yanayopatikana.",wenze:"Bado hakuna bidhaa zinazouzwa hapa. Una kitu cha kuuza?",shops:"Bado hakuna maduka hapa. Ungependa kufungua lako?",welcome:"Karibu kwenye Wenze!"},
};
for(const locale of ["en","fr","ln","sw"] as const){
 for(const market of ["wenze","shops"] as const){
  it(`states the empty ${market} result once in ${locale} and preserves its heading and selling destinations`,()=>{
   const html=renderToStaticMarkup(<MarketplaceWelcome market={market} locale={locale}><WenzeSellingInvitations compact locale={locale}/></MarketplaceWelcome>);
   const text=emptyCopy[locale],base=locale==="en"?"/shida":`/${locale}/shida`;
   expect(html).toContain(`<h2>${text.welcome}</h2>`);
   expect(html).toContain(`<p class="market-empty-status" role="status">${text[market]}</p>`);
   expect(html.split(text[market])).toHaveLength(2);
   expect(html).not.toContain(text.generic);
   expect(html).toContain(`href="${base}/wenze/sell/"`);
   expect(html).toContain(`href="${base}/seller/wenze/"`);
  });
 }
 it(`retains explicit empty status and the invitation for other ${locale} marketplaces`,()=>{
  for(const market of ["services","restaurants","emplois","appartements","hotels"] as const){
   const html=renderToStaticMarkup(<MarketplaceWelcome market={market} locale={locale}><Link href="/example">Continue</Link></MarketplaceWelcome>);
   expect(html).toContain(`<p class="market-empty-status" role="status">${emptyCopy[locale].generic}</p><p>`);
   expect(html.match(/role="status"/g)).toHaveLength(1);
   expect(html).toContain('href="/example"');
  }
 });
}
