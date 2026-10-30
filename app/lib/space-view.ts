export type SpaceView='orders'|'requests'|'messages'|'receipts'|'settings'|'management'|'support'|'recovery'|'transactions';
export function resolveSpaceView(value?:string,inbox=false):SpaceView{
 if(inbox||value==='inbox')return 'messages';
 return ['orders','requests','messages','receipts','settings','management','support','recovery','transactions'].includes(value??'')?value as SpaceView:'management';
}
