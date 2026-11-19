import {afterEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {JobListDetail,selectsJobPane} from "../app/components/shida/job-list-detail";
import {JobPagination} from "../app/components/shida/jobs";
import {JobDetailContent} from "../app/components/shida/job-presentation";
import type {PublicJob,JobCollection} from "../app/types/shida-public";
// Reuse the established synthetic Employment fixture; no provider/real account.
import {mobileJob} from "./fixtures/emploi-mobile.mjs";

afterEach(()=>vi.unstubAllGlobals());
const item=mobileJob(0,0) as PublicJob;

describe("Employment list and detail layout",()=>{
  it.each(["fr","en","ln","sw"] as const)("server renders public rows and a preview only in %s",locale=>{
    const fetch=vi.fn();vi.stubGlobal("fetch",fetch);
    const withPrivateFields:PublicJob={...item,responsibilities:"PRIVATE_FULL_TEXT",short_summary:"NOT_A_PUBLIC_PREVIEW",summary_preview:"Public preview only",salary_visibility:"hidden",salary:{minimum:"991234",maximum:null,currency:"USD",period:"month"}};
    const html=renderToStaticMarkup(<JobListDetail locale={locale} items={[withPrivateFields]}/>);
    expect(html).toContain('class="job-list-row"');
    expect(html).toContain('class="job-list-pane"');
    expect(html).toContain(`href="${locale==="en"?"":"/"+locale}/shida/emplois/JOB_mobile00"`);
    expect(html).toContain("Public preview only");
    expect(html).not.toContain("PRIVATE_FULL_TEXT");
    expect(html).not.toContain("NOT_A_PUBLIC_PREVIEW");
    expect(html).not.toContain("991234");
    expect(html).not.toContain("/external-action");
    expect(html).not.toContain("job-result-list");
    expect(html).not.toContain("<h1");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("preserves anonymous individual identity and long titles without a fabricated employer profile",()=>{
    const personal={...item,offer_type:"individual" as const,origin:"direct" as const,title:"Aide à domicile ".repeat(25),employer:{...item.employer,identity_type:"individual" as const,public_ref:null,slug:null,name:"Employeur particulier"}};
    const html=renderToStaticMarkup(<JobListDetail locale="fr" items={[personal]}/>);
    expect(html).toContain(personal.title);
    expect(html).not.toContain("/employeurs/");
    expect(html).not.toContain("Wave Mobile Money");
  });
  it("keeps full-detail actions in the authenticated renderer without duplicate page landmarks",()=>{
    const full=renderToStaticMarkup(<JobDetailContent locale="fr" item={item} similar={[item]} embedded/>);
    expect(full).toContain("Assistance aux utilisateurs.");
    expect(full).toContain("Postuler sur le site officiel");
    expect(full).not.toContain("<h1");
    expect(full).not.toContain("<main");
    expect(full).not.toContain('class="job-detail-return"');
    expect(full).not.toContain('class="section job-similar"');
    const page=renderToStaticMarkup(<JobDetailContent locale="fr" item={item} similar={[item]}/>);
    expect(page).toContain("<h1");expect(page).toContain("<main");expect(page).toContain('class="job-detail-return"');
  });
  it("leaves mobile and modified/native new-tab clicks to canonical navigation",()=>{
    const event={button:0,ctrlKey:false,metaKey:false,shiftKey:false,altKey:false};
    expect(selectsJobPane(event,true)).toBe(true);
    expect(selectsJobPane(event,false)).toBe(false);
    expect(selectsJobPane({...event,button:1},true)).toBe(false);
    for(const key of ["ctrlKey","metaKey","shiftKey","altKey"] as const)expect(selectsJobPane({...event,[key]:true},true)).toBe(false);
  });
  it.each(["fr","en","ln","sw"] as const)("keeps pagination distinct, localized and filter-preserving in %s",locale=>{
    const collection:JobCollection={items:[],pagination:{page:2,page_size:12,total_pages:3,total_items:30}};
    const html=renderToStaticMarkup(<JobPagination locale={locale} search={{query:"assistant",city:"Kinshasa",view:"professional",category:"it_telecommunications",page:2}} collection={collection}/>);
    expect(html).toContain('class="jobs-pagination"');
    expect(html).toContain('class="jobs-page-position" aria-current="page"');
    expect(html).toContain('rel="prev"');expect(html).toContain('rel="next"');
    expect(html).toContain("query=assistant&amp;city=Kinshasa&amp;category=it_telecommunications&amp;view=professional&amp;page=1");
    expect(html).toContain("page=3");expect(html).not.toContain("marketplace-pagination");
    for(const page of [1,3]){
      const boundary=renderToStaticMarkup(<JobPagination locale={locale} search={{}} collection={{...collection,pagination:{...collection.pagination,page}}}/>);
      expect(boundary.match(/aria-disabled="true"/g)).toHaveLength(1);
      expect(boundary).not.toContain(page===1?'rel="prev"':'rel="next"');
    }
  });
});
