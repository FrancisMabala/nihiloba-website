import {expect, type Page} from '@playwright/test';

export async function assertSearchLayout(page: Page, width: number) {
 const row=page.locator('.mp-search-primary:visible').first();
 const boxes=await row.locator(':scope > label, :scope > button').evaluateAll(elements=>elements.map(element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};}));
 expect(boxes).toHaveLength(3);
 for(const box of boxes){expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);}
 if(width>700){for(const box of boxes){expect(Math.abs(box.y-boxes[0].y)).toBeLessThan(2);expect(Math.abs(box.height-boxes[0].height)).toBeLessThan(2);}}
 else {for(let i=1;i<boxes.length;i++){expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i-1].bottom);expect(Math.abs(boxes[i].width-boxes[0].width)).toBeLessThan(2);}}
}
