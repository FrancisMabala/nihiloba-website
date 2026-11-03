import {defineConfig} from 'vitest/config';
import {fileURLToPath} from 'node:url';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},test:{include:['tests/services-management-gateway.test.ts','tests/services-work-model.test.ts','tests/services-account-navigation.test.tsx']}});
