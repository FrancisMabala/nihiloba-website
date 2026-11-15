// No listening port: Playwright fulfills documents/assets from this isolated build.
// Real AccountSpace + SiteChrome; only Next routing/image wrappers are adapted.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
export async function offlinePage(){
 const root=process.cwd(),require=createRequire(path.join(root,'package.json'));
 const {build}=await import(pathToFileURL(require.resolve('vite')).href);
 const temp=process.env.SHIDA_OFFLINE_REUSE||process.env.SHIDA_OFFLINE_BUILD||(await fs.mkdtemp(path.join(os.tmpdir(),'shida-help-offline-')));
 if(!path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep+'shida-help-offline-'))throw Error('Unexpected fixture directory');
 if(!process.env.SHIDA_OFFLINE_REUSE){
 const slash=value=>value.replaceAll('\\','/');
 const modules=path.dirname(path.dirname(require.resolve('react/package.json')));
 await fs.writeFile(path.join(temp,'index.html'),'<html lang="fr"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div><script type="module" src="/entry.tsx"></script></body></html>');
 await fs.writeFile(path.join(temp,'entry.tsx'),`import React from 'react';import {createRoot} from 'react-dom/client';import {AccountSpace} from '${slash(root)}/app/components/shida/account-space';import {SiteChrome} from '${slash(root)}/app/components/site-chrome';import '${slash(root)}/app/globals.css';const locale=location.pathname.split('/')[1]==='shida'?'en':location.pathname.split('/')[1];document.documentElement.lang=locale;createRoot(document.getElementById('root')).render(<SiteChrome locale={locale}><AccountSpace locale={locale} initialView="questions"/></SiteChrome>);`);
 await fs.writeFile(path.join(temp,'image.tsx'),`import React from 'react';export default function Image({unoptimized,priority,fill,quality,loader,placeholder,blurDataURL,...props}){return <img {...props}/>}`);
 await fs.writeFile(path.join(temp,'link.tsx'),`import React from 'react';export default function Link({prefetch,replace,scroll,href,...props}){return <a href={typeof href==='string'?href:href.pathname} {...props}/>}`);
 await fs.writeFile(path.join(temp,'navigation.ts'),`export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);export const useRouter=()=>({push:url=>location.assign(url),replace:url=>location.replace(url),refresh:()=>location.reload(),back:()=>history.back(),prefetch:()=>{}});export function notFound(){throw Error('not found')}export const redirect=url=>location.assign(url);`);
 const globalCss=(await fs.readFile(path.join(root,'app/globals.css'),'utf8')).replace('@import "tailwindcss";','');
 // Use the already compiled application's global CSS, retaining Tailwind preflight.
 const buildPath=(await fs.readFile('C:/NIHILOBA/release-evidence/help-conversation-20261115/build-path.txt','utf8')).trim();
 const cssDir=path.join(buildPath,'.next/static/css'),cssFiles=await fs.readdir(cssDir);
 const cssContents=await Promise.all(cssFiles.filter(file=>file.endsWith('.css')).map(file=>fs.readFile(path.join(cssDir,file),'utf8')));
 const compiledGlobal=cssContents.find(css=>css.includes('--forest-deep:')&&css.includes('.skip-link'));
 await fs.writeFile(path.join(temp,'global.css'),compiledGlobal||globalCss);
 await build({configFile:false,root:temp,publicDir:path.join(root,'public'),define:{'process.env':{}},resolve:{alias:[{find:'@',replacement:root},{find:path.join(root,'app/globals.css').replaceAll('\\','/'),replacement:path.join(temp,'global.css')},...['image','link','navigation'].map(name=>({find:'next/'+name,replacement:path.join(temp,name+(name==='navigation'?'.ts':'.tsx'))})),{find:/^react-dom(\/.*)?$/,replacement:slash(path.join(modules,'react-dom'))+'$1'},{find:/^react(\/.*)?$/,replacement:slash(path.join(modules,'react'))+'$1'}]},css:{postcss:{plugins:[]}},build:{outDir:path.join(temp,'dist'),emptyOutDir:false},logLevel:'error'});
 }
 return {temp,serve:async route=>{
  const url=new URL(route.request().url()),relative=url.pathname.startsWith('/assets/')?url.pathname.slice(1):url.pathname.match(/\.(png|svg|webp|ico|woff2?)$/)?url.pathname.slice(1):'index.html';
  const file=path.resolve(temp,'dist',relative);if(!file.startsWith(path.resolve(temp,'dist')+path.sep))return route.abort();
  try{return await route.fulfill({path:file,contentType:file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':undefined});}catch{return route.fulfill({status:404,body:''});}
 }};
}
