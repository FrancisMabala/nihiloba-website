import {beforeEach,expect,it,vi} from "vitest";
import type {MouseEvent} from "react";
const {gate}=vi.hoisted(()=>({gate:vi.fn()}));
vi.mock("react",async importOriginal=>({...await importOriginal<typeof import("react")>(),useContext:()=>gate}));
import {JobAccessLink} from "../app/components/shida/job-access";

beforeEach(()=>gate.mockReset());
function click(){return {defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}} as MouseEvent<HTMLAnchorElement>;}
it("runs the unchanged access gate for normal links",()=>{
  const link=JobAccessLink({href:"/fr/shida/emplois/JOB_test",children:"Offer"});
  const event=click();link.props.onClick(event);
  expect(gate).toHaveBeenCalledExactlyOnceWith(event);
});
it("keeps the gate for mobile selection, and bypasses navigation only after pane selection prevented it",()=>{
  const pass=vi.fn(),mobile=JobAccessLink({href:"/fr/shida/emplois/JOB_test",children:"Offer",onClick:pass});
  const event=click();mobile.props.onClick(event);
  expect(pass).toHaveBeenCalledExactlyOnceWith(event);expect(gate).toHaveBeenCalledExactlyOnceWith(event);
  gate.mockClear();
  const desktop=JobAccessLink({href:"/fr/shida/emplois/JOB_test",children:"Offer",onClick:e=>e.preventDefault(),current:true,controls:"selected-offer"});
  desktop.props.onClick(click());expect(gate).not.toHaveBeenCalled();
  expect(desktop.props.href).toBe("/fr/shida/emplois/JOB_test");
  expect(desktop.props["aria-current"]).toBe(true);expect(desktop.props["aria-controls"]).toBe("selected-offer");
});
