import {it,expect} from 'vitest';
import {wenzeScanCode} from '../app/lib/wenze-scan-code';
it('accepts product variant and operational codes without accepting arbitrary QR content',()=>{
 expect(wenzeScanCode(' WNP_product123 ')).toBe('WNP_product123');
 expect(wenzeScanCode('WNV_variant123')).toBe('WNV_variant123');
 expect(wenzeScanCode('INV-ABC123')).toBe('INV-ABC123');
 expect(wenzeScanCode('https://nihiloba.com/fr/shida/wenze/products/WNP_product123/')).toBe('WNP_product123');
 for(const value of ['https://evil.example/shida/wenze/products/WNP_product123','https://nihiloba.com/shida/wenze/WNZ_shop','SHIDA RECEIPT WRC_123','javascript:alert(1)','https://user@nihiloba.com/shida/wenze/products/WNP_product123','WNP_../private'])expect(wenzeScanCode(value)).toBeNull();
});
