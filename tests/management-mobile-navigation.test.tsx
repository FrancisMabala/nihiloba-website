import {renderToStaticMarkup} from "react-dom/server";
import {it,expect} from "vitest";
import {ManagementMobileNavigation} from "@/app/components/shida/management-mobile-navigation";
const items=[{key:"today",label:"Today"},{key:"orders",label:"Orders"},{key:"items",label:"Menu"},{key:"daily",label:"Finances"},{key:"inventory",label:"Stock"},{key:"profile",label:"Establishment"}];
it("keeps four primary destinations and marks More active for a nested tool",()=>{
 const html=renderToStaticMarkup(<ManagementMobileNavigation locale="en" items={items} primary={['today','orders','items','daily']} current="inventory" onNavigate={()=>{}}/>);
 const [bar,sheet]=html.split('<dialog');
 expect((bar.match(/<button /g)||[])).length(5);
 expect(bar).toMatch(/aria-haspopup="dialog"[^>]*aria-current="page"/);
 expect(sheet).toContain('Stock');expect(sheet).toContain('Establishment');
});
it("omits unavailable destinations, preserves busy controls and never guesses an active page",()=>{
 const html=renderToStaticMarkup(<ManagementMobileNavigation locale="en" items={items.slice(0,2)} primary={['today','orders','items','daily']} onNavigate={()=>{}} disabled/>);
 const bar=html.split('<dialog')[0];
 expect(bar).not.toContain('aria-label="Menu"');expect(bar).not.toContain('aria-current');
 expect((bar.match(/disabled=""/g)||[])).length(2);
});
it('keeps Services work, calendar and More with provider identity and a separate return action',()=>{
 const html=renderToStaticMarkup(<ManagementMobileNavigation variant="services" locale="fr" identity={<strong>Cabinet</strong>} items={[{key:'overview',label:'Aujourd’hui'},{key:'work',label:'Demandes et missions'},{key:'calendar',label:'Calendrier'},{key:'available',label:'Trouver des missions'},{key:'finance',label:'Finances'}]} primary={['overview','work','calendar']} current="available" onNavigate={()=>{}} extra={<button>Retour à mon espace</button>}/>);
 const [bar,sheet]=html.split('<dialog');expect((bar.match(/<button /g)||[])).length(4);expect(bar).toContain('aria-label="Calendrier"');expect(bar).toMatch(/aria-haspopup="dialog"[^>]*aria-current="page"/);expect(sheet).toContain('Cabinet');expect(sheet).toContain('Retour à mon espace');
});
