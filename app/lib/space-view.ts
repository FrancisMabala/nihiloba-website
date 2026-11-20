export type SpaceView='profiles'|'manage'|'overview'|'orders'|'requests'|'messages'|'receipts'|'settings'|'management'|'questions'|'support'|'recovery'|'transactions'|'listings'|'candidate'|'job-offer'|'job-search';
export function resolveSpaceView(value?:string,inbox=false):SpaceView{
 if(inbox||value==='inbox')return 'messages';
 return ['profiles','manage','overview','orders','requests','messages','receipts','settings','management','questions','support','recovery','transactions','listings','candidate','job-offer','job-search'].includes(value??'')?value as SpaceView:'overview';
}
