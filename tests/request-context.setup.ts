// Server transports need a request context. Anonymous by default; tests of
// authenticated gateways provide their own explicit cookie/header fixtures.
import {vi} from 'vitest';
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>undefined,has:()=>false}),headers:async()=>new Headers()}));
