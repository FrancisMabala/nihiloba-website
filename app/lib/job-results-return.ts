// Tab-local UI position only; never contains account or application data.
const key='shida-job-results-return';
type Saved={list:string;detail:string;scroll:number;at:number;restore?:boolean};
function read():Saved|null{try{const value=JSON.parse(sessionStorage.getItem(key)??'null') as Saved|null;return value&&typeof value.list==='string'&&typeof value.detail==='string'&&value.list.startsWith('/')&&!value.list.startsWith('//')&&Number.isFinite(value.scroll)&&value.scroll>=0&&Date.now()-value.at<3600000?value:null;}catch{return null;}}
export function rememberJobResults(detail:string){try{sessionStorage.setItem(key,JSON.stringify({list:location.pathname+location.search,detail,scroll:window.scrollY,at:Date.now()}));}catch{/* Navigation still works without storage. */}}
export function jobResultsReturn(destination:string){const saved=read();if(!saved)return null;const list=new URL(saved.list,location.origin);return list.pathname.replace(/\/$/,'')===destination.replace(/\/$/,'')&&saved.detail.split('?')[0].replace(/\/$/,'')===location.pathname.replace(/\/$/,'')?saved.list:null;}
export function markJobResultsReturn(){const saved=read();if(saved)try{sessionStorage.setItem(key,JSON.stringify({...saved,restore:true}));}catch{}}
export function restoreJobResults(){const saved=read();if(!saved?.restore||saved.list!==location.pathname+location.search)return;try{sessionStorage.removeItem(key);}catch{}requestAnimationFrame(()=>window.scrollTo(0,saved.scroll));}
