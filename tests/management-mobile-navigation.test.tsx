// @vitest-environment jsdom
import {render,screen,fireEvent,waitFor,within,cleanup} from "@testing-library/react";
import {beforeEach,afterEach,it,expect,vi} from "vitest";
import {ManagementMobileNavigation} from "@/app/components/shida/management-mobile-navigation";
import "@testing-library/jest-dom/vitest";
const items=[{key:"today",label:"Aujourd’hui"},{key:"orders",label:"Commandes"},{key:"items",label:"Mon menu"},{key:"daily",label:"Finances"},{key:"inventory",label:"Mon stock"},{key:"profile",label:"Mon établissement"}];
beforeEach(()=>{vi.stubGlobal("matchMedia",()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));HTMLDialogElement.prototype.showModal=function(){this.setAttribute("open","");this.querySelector<HTMLButtonElement>('button')?.focus();};HTMLDialogElement.prototype.close=function(){this.removeAttribute("open");this.dispatchEvent(new Event("close"));};});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it("opens permitted overflow destinations and preserves a cancelled dirty-form transition",async()=>{
 const select=vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
 render(<ManagementMobileNavigation locale="fr" items={items} primary={['today','orders','items','daily']} current="inventory" onNavigate={select}/>);
 const more=screen.getByRole('button',{name:'Plus'});expect(more).toHaveAttribute('aria-current','page');fireEvent.click(more);
 const dialog=screen.getByRole('dialog');fireEvent.click(within(dialog).getByRole('button',{name:'Mon stock'}));
 await waitFor(()=>expect(select).toHaveBeenCalledWith('inventory'));expect(dialog).toHaveAttribute('open');
 await waitFor(()=>expect(within(dialog).getByRole('button',{name:'Mon stock'})).toBeEnabled());
 fireEvent.click(within(dialog).getByRole('button',{name:'Mon stock'}));await waitFor(()=>expect(dialog).not.toHaveAttribute('open'));await waitFor(()=>expect(more).toHaveFocus());
});
it("never shows an unavailable destination and blocks navigation while saving",()=>{
 const select=vi.fn();const {rerender}=render(<ManagementMobileNavigation locale="en" items={items.slice(0,2)} primary={['today','orders','items','daily']} current="today" onNavigate={select} disabled/>);
 expect(screen.queryByRole('button',{name:'Mon menu'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Commandes'}));expect(select).not.toHaveBeenCalled();
 rerender(<ManagementMobileNavigation locale="en" items={items.slice(0,1)} primary={['today','orders']} onNavigate={select}/>);
 expect(screen.queryByRole('button',{name:'Commandes'})).toBeNull();expect(screen.getByRole('button',{name:'Aujourd’hui'})).not.toHaveAttribute('aria-current');
});
