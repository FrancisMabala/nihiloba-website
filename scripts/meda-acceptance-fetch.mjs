// Loopback transport only; every API response comes from the real backend.
if(process.env.MEDA_ACCEPTANCE==='1'){
 const original=globalThis.fetch;
 globalThis.fetch=(input,init)=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  if(url.origin==='https://meda.fixture.invalid'){
   url.protocol='http:';url.hostname='127.0.0.1';url.port='8067';
   return original(input instanceof Request?new Request(url,input):url,init);
  }
  return original(input,init);
 };
}
