import {it,expect} from 'vitest';
import {managedActivities,dashboardActivities,individualOnlyActivities,activityCounts} from '../app/lib/personal-activities';
it('accepts only known nonnegative integer management counts without inventing missing totals',()=>{
 expect(activityCounts({listings:3,apartments:2,jobs:0,hotels:-1,wewa:1.5,wenze:'2',secret:4})).toEqual({listings:3,jobs:0,apartments:2});
 expect(activityCounts(null)).toEqual({});
});
it('keeps creation capability separate from existing activities',()=>{const value=managedActivities('restaurants',{items:[{public_ref:'RST_1',profile:{name:'Kitchen'},status:'inactive'}],actions:[],total:30});expect(value.setup).toBe(false);expect(value.items[0].query).toBe('establishment=RST_1');expect(value.items[0].published).toBe(false);expect(value.more).toBe(true);});
it('fails closed without Services capability',()=>{expect(()=>managedActivities('services',{profiles:[]},{capabilities:[]})).toThrow();expect(managedActivities('services',{profiles:[]},{capabilities:['profile']}).setup).toBe(true);});
it('preserves multiple shops and selects the exact store',()=>{const value=managedActivities('wenze',{stores:[{public_ref:'WNS_one',name:'First'},{public_ref:'WNS_two',name:'Second',catalog_ready:true}]});expect(value.items).toHaveLength(2);expect(value.items[1].query).toBe('store=WNS_two');expect(value.setup).toBe(false);});

it('never mistakes catalog readiness for publication',()=>{const value=managedActivities('wenze',{stores:[{public_ref:'WNS_hidden',name:'Private shop',catalog_ready:true,status:'active',visible:'false'},{public_ref:'WNS_unknown',name:'Unknown',catalog_ready:true}]});expect(value.items[0].published).toBe(false);expect(value.items[1].published).toBeNull();});

it('retains incomplete, inactive and individual activity records without inventing publication',()=>{
 const value=managedActivities('wenze',{stores:[
  {public_ref:'WNZ_old',name:null,category:null,city:null,catalog_ready:false,status:'inactive',visible:'true'},
  {public_ref:'WNZ_sale',name:'Personal sales',selling_mode:'individual',status:'active',visible:'true',catalog_ready:true},
 ]});
 expect(value.items).toHaveLength(2);
 expect(value.items[0]).toMatchObject({status:'needsUpdate',published:false,missing:['name','location','category'],query:'store=WNZ_old&view=shop'});
 expect(value.items[1].individual).toBe(true);
});

it('a missing legacy title does not discard the other authorized activities',()=>{
 const value=managedActivities('restaurants',{items:[{public_ref:'RST_old',profile:{},status:'inactive'},{public_ref:'RST_current',profile:{name:'Kitchen'},status:'active'}]});
 expect(value.items).toHaveLength(2);expect(value.items[0].status).toBe('needsUpdate');expect(value.items[1].name).toBe('Kitchen');
});
it('retains approved images only and handles pending moderation',()=>{
 const image='https://res.cloudinary.com/dbrxpvmzp/image/upload/test-shop.jpg';
 const rows=managedActivities('wenze',{stores:[{public_ref:'WNZ_a',name:'Pending',status:'pending_approval',profile_image_url:image},{public_ref:'WNZ_b',name:'Unsafe',profile_image_url:'https://unknown.invalid/private.jpg'}]}).items;
 expect(rows[0]).toMatchObject({image,status:'pending'});expect(rows[1].image).toBeNull();
});
it('uses restaurant photo and broad service location without hiding legacy rows',()=>{
 const image='https://res.cloudinary.com/dbrxpvmzp/image/upload/test-restaurant.jpg';
 expect(managedActivities('restaurants',{items:[{public_ref:'RST_a',profile:{name:'Kitchen',city:'Kinshasa',establishment_photo_url:image}}]}).items[0]).toMatchObject({image,location:'Kinshasa'});
 expect(managedActivities('services',{profiles:[{public_ref:'SVC_a',service_name:'Repair',commune:'Gombe',missing_fields:['category']}]},{capabilities:['profile']}).items[0]).toMatchObject({location:'Gombe',status:'needsUpdate'});
});

it('groups service offerings by explicit professional identity without merging unrelated providers',()=>{
 const items=managedActivities('services',{profiles:[
  {public_ref:'SVC_a',provider_ref:'PRO_one',service_name:'Legal advice',is_active:'yes',professional_profile:{name:'Horizon'},visible_to_customers:true},
  {public_ref:'SVC_b',provider_ref:'PRO_one',service_name:'Business advice',professional_profile:{name:'Horizon'},is_active:'no'},
  {public_ref:'SVC_c',provider_ref:'PRO_two',service_name:'Haircut',professional_profile:{name:'Salon'}},
  {public_ref:'SVC_legacy',service_name:'Legacy service'},
 ]},{capabilities:['profile']}).items;
 const result=dashboardActivities(items);
 expect(result).toHaveLength(3);
 expect(result[0]).toMatchObject({name:'Horizon',providerRef:'PRO_one',offeringCount:1,status:'mixed',published:true,query:'view=services&provider=PRO_one'});
 expect(result[1].providerRef).toBe('PRO_two');expect(result[2].ref).toBe('SVC_legacy');
});
it('deduplicates the same store reference without turning a quick-sale identity into a shop',()=>{
 const items=managedActivities('wenze',{stores:[{public_ref:'WNS_shop',name:'Shop'},{public_ref:'WNS_shop',name:'Shop'},{public_ref:'WNS_quick',selling_mode:'individual',name:'Quick sale'}]}).items;
 expect(dashboardActivities(items)).toHaveLength(2);expect(dashboardActivities(items).filter(row=>!row.individual)).toHaveLength(1);
});

it('only makes listings primary after a complete occasional-only activity read',()=>{
 const item=managedActivities('wenze',{stores:[{public_ref:'WNS_individual',selling_mode:'individual',name:'Items'}]}).items[0];
 const data={items:[item],failed:false,more:false,markets:['wenze'],business:false};
 expect(individualOnlyActivities(data)).toBe(true);
 for(const patch of [{failed:true},{more:true},{business:true},{items:[]},{markets:['wenze','apartments']},{items:[item,{...item,individual:false,ref:'WNS_shop'}]},{items:[item,{...item,individual:false,market:'services' as const}]}])expect(individualOnlyActivities({...data,...patch})).toBe(false);
 expect(individualOnlyActivities(null)).toBe(false);
});
