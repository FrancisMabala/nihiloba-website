import {it,expect} from 'vitest';
import {obligationTitle,obligationDetail,obligationHref} from '../app/lib/deletion-obligations';
it.each(['en','fr','ln','sw'] as const)('keeps unknown names, internal references and unknown statuses out of presentation in %s',locale=>{
 const item={reference:'BUS_PRIVATE',kind:'organization_responsibilities',display_name:null};
 expect(obligationTitle(locale,item)).not.toContain('BUS_');
 expect(obligationTitle(locale,{...item,display_name:'Actual organization'})).toBe('Actual organization');
 expect(obligationDetail(locale,{...item,kind:'restaurant_order',status:'internal_enum'})).not.toContain('internal_enum');
 expect(obligationHref(locale,{...item,action:'organization',action_path:'https://business.nihiloba.com/businesses/BUS_PRIVATE/settings'})).toContain(`?lang=${locale}`);
});
it('accepts exact implemented destinations and rejects lookalike, generic and executable URLs',()=>{
 const item={reference:'ROD_fixture',kind:'restaurant_order',action:'activity'};
 expect(obligationHref('fr',{...item,action_path:'/shida/restaurant-orders/ROD_fixture/'})).toBe('/fr/shida/restaurant-orders/ROD_fixture/');
 for(const action_path of ['javascript:alert(1)','//evil.test/path','/shida/restaurant-orders/','/shida/space/?view=support','https://business.nihiloba.com.evil.test/businesses/BUS_a/settings'])expect(obligationHref('fr',{...item,action_path})).toBeNull();
});
