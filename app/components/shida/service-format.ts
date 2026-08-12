export function formatServiceDuration(minutes:number):string {
  if(minutes<60)return `${minutes} min`;
  const hours=Math.floor(minutes/60),rest=minutes%60;
  return `${hours} h${rest?` ${rest}`:""}`;
}
