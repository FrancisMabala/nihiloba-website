import {it,expect} from 'vitest';
import {managedActivities} from '../app/lib/personal-activities';
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
