export type SpaceView='overview'|'orders'|'requests'|'messages'|'receipts'|'settings'|'management'|'support'|'recovery'|'transactions'|'listings'|'candidate'|'job-offer';
export function resolveSpaceView(value?:string,inbox=false):SpaceView{
 if(inbox||value==='inbox')return 'messages';
 return ['overview','orders','requests','messages','receipts','settings','management','support','recovery','transactions','listings','candidate','job-offer'].includes(value??'')?value as SpaceView:'overview';
}
