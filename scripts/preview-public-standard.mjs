// Local synthetic preview only. Never imported by application code.
// Run after a production build: node scripts/preview-public-standard.mjs
import {fileURLToPath} from 'node:url';

process.env.SHIDA_API_BASE_URL='https://services-11111111-1111-1111-1111-111111111111.fixture.invalid';
process.env.SERVICES_FIXTURE_MODE='1';
await import('./compact-marketplace-fixture-fetch.mjs');

if(process.argv.includes('--check')){
  const response=await fetch(`${process.env.SHIDA_API_BASE_URL}/api/public/shida/jobs`);
  const data=await response.json();
  if(data.items?.length!==3||data.items[0]?.public_ref!=='JOB_compact0'){
    throw new Error('Public marketplace synthetic fixture validation failed');
  }
  console.log('Synthetic public marketplace configuration verified (3 fixture jobs). No server started.');
}else{
  const root=fileURLToPath(new URL('../',import.meta.url));
  const cli=new URL('../node_modules/next/dist/bin/next',import.meta.url);
  process.argv=[process.execPath,fileURLToPath(cli),'start',root,'--hostname','127.0.0.1','--port','3017'];
  console.log('Starting synthetic public marketplace preview on http://127.0.0.1:3017');
  await import(cli.href);
}
