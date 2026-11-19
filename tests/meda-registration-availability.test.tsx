import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import {MedaMarketplace} from '../app/components/shida/meda-marketplace';
import {medaCopy} from '../app/lib/meda-copy';
import {medaDiscoveryCopy} from '../app/lib/meda-discovery-copy';

const actor=vi.hoisted(()=>({binding:null as string|null,checking:false,login:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),replace:vi.fn()})}));
vi.mock('../app/components/shida/wenze-buyer',()=>({
 WenzeBuyerProvider:({children}:{children:import('react').ReactNode})=>children,
 useWenzeBuyer:()=>actor,
}));
afterEach(()=>{vi.unstubAllEnvs();actor.binding=null;});

for(const locale of ['en','fr','ln','sw'] as const){
 for(const enabled of ['false',undefined,'true'] as const){
  it(`keeps Meda guest access truthful for ${locale} with registration ${String(enabled)}`,()=>{
   vi.stubEnv('NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED',enabled);
   const html=renderToStaticMarkup(<MedaMarketplace locale={locale}/>),prefix=locale==='en'?'':`/${locale}`;
   expect(html).toContain('class="meda-panel meda-access"');
   expect(html).toContain(`>${medaCopy[locale].signIn}</button>`);
   expect(html).not.toContain('class="meda-search"');
   const register=(html.match(/<a\b[^>]*>/g)??[]).find(anchor=>anchor.includes('/shida/register/'));
   if(enabled==='true'){
    expect(register).toContain(`href="${prefix}/shida/register/?returnTo=${encodeURIComponent(`${prefix}/shida/meda/`)}"`);
    expect(html).toContain(`>${medaDiscoveryCopy[locale].register}</a>`);
   }else expect(register).toBeUndefined();
  });
 }
 it(`preserves the authenticated ${locale} Meda view independently of registration availability`,()=>{
  actor.binding='synthetic-unit-binding';
  const states=['false',undefined,'true'].map(enabled=>{
   vi.stubEnv('NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED',enabled);
   return renderToStaticMarkup(<MedaMarketplace locale={locale}/>);
  });
  expect(states[0]).toBe(states[1]);expect(states[1]).toBe(states[2]);
  expect(states[0]).toContain('class="meda-search"');
  expect(states[0]).not.toContain('class="meda-panel meda-access"');
 });
}
