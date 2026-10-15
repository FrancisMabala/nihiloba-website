import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,it,expect} from "vitest";
import {ServiceBranchChoice} from "../app/components/shida/service-branch-choice";
describe("customer visit choices",()=>{
 it.each(["fr","en","ln","sw"] as const)("shows public labels and requires a selection in %s",locale=>{
 const html=renderToStaticMarkup(<ServiceBranchChoice locale={locale} specified branches={[{branch_ref:"SBR_one",name:"North visits",broad_area:"Gombe",booking_url:"https://wa.me/123?text=START%20opaque"}]}/>);
 expect(html).toContain("North visits");expect(html).toContain("Gombe");expect(html).toContain("disabled");expect(html).not.toContain("Private destination");expect(html).not.toContain("href=");
 });
 it("keeps unspecified coverage unchanged",()=>expect(renderToStaticMarkup(<ServiceBranchChoice locale="en" specified={false} branches={[]}/>)).toBe(""));
 it("does not invent a branch for explicit empty coverage",()=>expect(renderToStaticMarkup(<ServiceBranchChoice locale="en" specified branches={[]}/>)).toContain("No branch is currently available"));
});
