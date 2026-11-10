// Component browser checks for low-disk environments: existing Vite/Chromium,
// no Next production build. All network APIs are intercepted by Playwright.
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../..', import.meta.url));
const fixture = fileURLToPath(new URL('./job-search-harness.tsx', import.meta.url));
const server = await createServer({
  configFile: false, root, cacheDir: 'test-results/job-search-vite',
  server: {host: '127.0.0.1', port: 3049, strictPort: true},
  resolve: {alias: {'next/navigation': fixture, 'next/link': fixture, 'next/image': fixture, '@': root}},
  define: {'process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED': '"true"'},
  plugins: [{name: 'behaviour-only-fixture',
    transform(_source, id) { if (id.endsWith('.css')) return {code: '', map: null}; },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/health') { res.end('ok'); return; }
        if (!req.headers.accept?.includes('text/html')) return next();
        res.setHeader('Content-Type', 'text/html');
        res.end('<html><body><div id="root"></div><script type="module" src="/tests/browser/job-search-harness.tsx"></script></body></html>');
      });
    },
  }],
});
await server.listen();
