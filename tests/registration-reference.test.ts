import {afterEach,expect,it,vi} from 'vitest';
import {GET,POST} from '../app/api/shida/registration-reference/route';
afterEach(()=>vi.unstubAllGlobals());
it('reads shared reference data without forwarding identity or accepting arbitrary routes',async()=>{
 const fetcher=vi.fn(async()=>Response.json({items:[{code:'SE',name:'Sweden'}],matched_code:'SE'}));vi.stubGlobal('fetch',fetcher);
 const response=await GET(new Request('https://nihiloba.com/api/shida/registration-reference/?q=Swedn&language=en',{headers:{Origin:'https://nihiloba.com'}}));
 expect(response.status).toBe(200);expect(fetcher).toHaveBeenCalledWith('https://api.nihiloba.com/api/dashboard/registration/reference/countries?language=en&q=Swedn',expect.objectContaining({redirect:'manual',headers:{Origin:'https://nihiloba.com','Content-Type':'application/json'}}));
});
it('bounds suggestions and requires the mutation origin',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 expect((await POST(new Request('https://nihiloba.com/api/shida/registration-reference/',{method:'POST',headers:{Origin:'https://evil.example'},body:'{}'}))).status).toBe(403);
 expect((await POST(new Request('https://nihiloba.com/api/shida/registration-reference/',{method:'POST',headers:{Origin:'https://nihiloba.com'},body:JSON.stringify({name:'x'.repeat(2000)})}))).status).toBe(413);
 expect(fetcher).not.toHaveBeenCalled();
});
