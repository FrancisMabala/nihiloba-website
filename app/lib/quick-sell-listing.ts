export const articleFilters=['all','available','drafts','pending','sold','unpublished','unavailable','archived'] as const;
export type ArticleFilter=(typeof articleFilters)[number];

type ArticleStateInput={
 status:string;
 visible:string|boolean;
 quick_sell_state?:string;
 available_stock:number|null;
 sale_provenance?:'shida_completed'|'seller_reported'|'unknown';
 photos:{url:string}[];
};

export function readArticleFilter(value:string|null):ArticleFilter{
 return articleFilters.find(filter=>filter===value)??'all';
}

export function articleListingState(item:ArticleStateInput){
 const active=item.status==='active';
 const online=active&&(item.visible==='true'||item.visible===true);
 const archived=item.status==='archived'||item.status==='deleted'||item.quick_sell_state==='archived';
 const pending=item.quick_sell_state==='pending';
 const sold=item.available_stock===0&&(item.sale_provenance==='shida_completed'||item.sale_provenance==='seller_reported');
 const available=typeof item.available_stock==='number'&&item.available_stock>0;
 return {
  active,online,archived,pending,sold,
  hidden:active&&!online,
  unavailable:active&&!sold&&!pending&&item.available_stock===0,
  mayShow:active&&!online&&!sold&&(available||pending)&&item.photos.length>0,
  mayMarkSold:active&&!pending&&!sold&&available,
 };
}

export function matchesArticleFilter(item:ArticleStateInput,filter:ArticleFilter):boolean{
 const state=articleListingState(item);
 switch(filter){
  case 'all':return true;
  case 'available':return state.online;
  case 'drafts':return false;
  case 'pending':return state.pending;
  case 'sold':return state.sold;
  case 'unpublished':return state.hidden;
  case 'unavailable':return state.unavailable;
  case 'archived':return state.archived;
 }
}
