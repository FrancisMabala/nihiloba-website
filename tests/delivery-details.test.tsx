import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {DeliveryDetails,deliveryLabels} from "../app/components/shida/delivery-details";
describe('private destination presentation',()=>{
 it.each(['en','fr','ln','sw'] as const)('labels exact fields and safely renders long text in %s',locale=>{
 const html=renderToStaticMarkup(<DeliveryDetails locale={locale} fields={{country:'CD',city:'Kinshasa',commune:'Gombe',address:'<script>private destination</script>',instructions:'Ring twice'}}/>);
 expect(html).toContain(deliveryLabels[locale].address);expect(html).toContain(deliveryLabels[locale].instructions);expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');
 });
 it('does not invent a destination for legacy empty records',()=>{expect(renderToStaticMarkup(<DeliveryDetails locale="en" fields={null}/>)).not.toContain('<dd');});
});
