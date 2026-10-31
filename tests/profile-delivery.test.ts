import {expect,it} from 'vitest';
import {restaurantProfileDestination,wenzeProfileDestination} from '../app/lib/profile-delivery';
const profile={country_code:'CD',city:'Kinshasa',commune:'Gombe',quartier:'Manual quartier',avenue:'Private street',parcel_number:'2',landmark:'Gate'};
it('matches restaurant coverage exactly and maps only destination fields',()=>{
 const areas=[{country:'CD',city:'Kinshasa',commune:'Gombe'}];
 expect(restaurantProfileDestination(profile,areas)).toEqual({index:0,address:{street:'Private street',building:'2',landmark:'Gate',quartier:'Manual quartier'}});
 for(const changes of [{country_code:'SE'},{city:'Lubumbashi'},{commune:'Lemba'}])expect(restaurantProfileDestination({...profile,...changes},areas)).toBeNull();
 expect(restaurantProfileDestination(profile,[{...areas[0],quartier:'Different quartier'}])).toBeNull();
});
it('never invents a precise address or imports a foreign address into country-less Wenze checkout',()=>{
 expect(wenzeProfileDestination({...profile,avenue:null,parcel_number:null})?.address).toBe('');
 expect(wenzeProfileDestination({...profile,country_code:'SE'})).toBeNull();
 expect(wenzeProfileDestination(profile)).not.toHaveProperty('confirmed');
 expect(wenzeProfileDestination(profile)?.address).toBe('Private street, 2');
});
