import {renderToStaticMarkup} from 'react-dom/server';
import {beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({emptyStrings:0}));
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useEffect:()=>{},useState:(initial:unknown)=>{const [value,set]=actual.useState(initial);if(initial==='browse')return ['create',set];if(initial===''&&state.emptyStrings++===0)return ['meda_rate_limited',set];return [value,set];}};});
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),replace:vi.fn()})}));
vi.mock('../app/components/shida/wenze-buyer',()=>({WenzeBuyerProvider:({children}:{children:import('react').ReactNode})=>children,useWenzeBuyer:()=>({binding:'synthetic',checking:false,login:vi.fn()})}));
import {MedaMarketplace} from '../app/components/shida/meda-marketplace';
import {medaCopy} from '../app/lib/meda-copy';
beforeEach(()=>{state.emptyStrings=0;});
it.each(['fr','en','ln','sw'] as const)('shows a localized rate explanation while the authoring form stays mounted (%s)',locale=>{
 const html=renderToStaticMarkup(<MedaMarketplace locale={locale} embedded/>);
 expect(html).toContain(medaCopy[locale].meda_rate_limited);expect(html).not.toContain('>meda_rate_limited<');expect(html).toContain('class="meda-panel meda-form"');expect(html).toContain('name="title"');expect(html).toContain('value="publish"');
});
