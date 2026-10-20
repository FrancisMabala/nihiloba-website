// Test-server preload only: all public catalog traffic uses synthetic records.
const originalFetch = global.fetch;
global.fetch = async function(input, init) {
  const url = new URL(typeof input === "string" ? input : input.url || String(input));
  if (url.hostname === "api.nihiloba.com") {
    if (url.pathname === "/api/public/shida/wenze/products") {
      const second = url.searchParams.has("cursor");
      const item = {public_ref:second?"WNP_SECOND":"WNP_FIRST",slug:null,name:second?"Second item":"Cotton shirt",
        description:"Synthetic product",category:"fashion_clothing",condition:"used",price:"15",currency:"USD",
        price_negotiable:false,available_stock:2,has_variants:true,variant_type:"size",
        variants:[{public_ref:"WNV_M",label:"M",variant_type:"size",available_stock:2,stock_quantity:2,is_available:true,buy_url:null}],
        images:[],public_detail_url:"https://nihiloba.com/shida/wenze/products/WNP_FIRST",buy_url:null,store:null,
        fulfillment:{methods:[],delivery:null}};
      return new Response(JSON.stringify({items:[item],count:1,has_more:!second,next_cursor:second?null:"fixture-next"}),{headers:{"Content-Type":"application/json"}});
    }
    return new Response("{}",{status:404});
  }
  return originalFetch(input,init);
};
