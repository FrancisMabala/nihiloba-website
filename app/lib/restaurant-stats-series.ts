import {shiftCalendarDate} from './restaurant-statistics';
export function restaurantSeries(from:string,to:string,through:string,rows:{date:string;count:number}[]){
 const known=new Map(rows.map(row=>[row.date,row.count]));const daily:{date:string;end:string;count:number}[]=[];
 for(let day=from;day<to&&day<=through&&daily.length<366;day=shiftCalendarDate(day,1))daily.push({date:day,end:day,count:known.get(day)??0});
 if(daily.length<=31)return {weekly:false,rows:daily};
 const weeks:typeof daily=[];for(let i=0;i<daily.length;i+=7){const chunk=daily.slice(i,i+7);weeks.push({date:chunk[0].date,end:chunk.at(-1)!.date,count:chunk.reduce((sum,row)=>sum+row.count,0)});}return {weekly:true,rows:weeks};
}
