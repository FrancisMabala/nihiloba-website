import {afterEach, expect, it, vi} from 'vitest';
import {randomUUID} from 'node:crypto';
import {POST} from '../app/api/shida/employer-pages/[reference]/view/route';

afterEach(()=>vi.unstubAllGlobals());
it('forwards only the two observation IDs to the employer endpoint',async()=>{
  const fetcher = vi.fn().mockResolvedValue(new Response(null,{status:204}));
  vi.stubGlobal('fetch',fetcher);
  const event = randomUUID(), visitor = randomUUID();
  const send = (reference:string,origin:string,receipt:string)=>POST(new Request('https://nihiloba.com/api/',{
    method:'POST',headers:{origin,'X-Shida-Event':receipt,'X-Shida-Visitor':visitor,cookie:'private=fixture'},
  }),{params:Promise.resolve({reference})});
  expect((await send('ORGDIR_demo','https://nihiloba.com',event)).status).toBe(204);
  expect(fetcher.mock.calls[0][0]).toBe('https://api.nihiloba.com/api/public/shida/jobs/employers/ORGDIR_demo/view');
  expect(fetcher.mock.calls[0][1].headers).toEqual({'X-Shida-Event':event,'X-Shida-Visitor':visitor});
  expect((await send('JOB_demo','https://nihiloba.com',event)).status).toBe(403);
  expect((await send('ORGDIR_demo','https://elsewhere.example',event)).status).toBe(403);
  expect((await send('ORGDIR_demo','https://nihiloba.com','invalid')).status).toBe(422);
  expect(fetcher).toHaveBeenCalledTimes(1);
});
