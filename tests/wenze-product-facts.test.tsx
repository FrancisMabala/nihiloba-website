import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WenzeProductFacts } from "../app/components/shida/wenze-product-facts";
import type { WenzeProduct } from "../app/types/shida-public";

function product(overrides: Partial<WenzeProduct> = {}): WenzeProduct {
  return { public_ref:"WNP_TEST", slug:null, name:"Example", description:null,
    category:"fashion_clothing", price:"15", currency:"USD", price_negotiable:false,
    available_stock:4, has_variants:true, variant_type:"size", variants:[],
    images:[], public_detail_url:"/shida/wenze/products/test", buy_url:null,
    store:null, fulfillment:{methods:[],delivery:null}, ...overrides };
}
const variant = (label: string, stock = 1) => ({public_ref:label,label,variant_type:"size",
  stock_quantity:stock,available_stock:stock,is_available:stock>0,buy_url:null});
describe("category product facts", () => {
  it("keeps older products neutral and hides unknown condition codes", () => {
    expect(renderToStaticMarkup(<WenzeProductFacts product={product()} locale="en"/>)).toBe("");
    expect(renderToStaticMarkup(<WenzeProductFacts product={product({condition:"internal"})} locale="fr"/>)).toBe("");
  });
  it("shows supplied available sizes, excluding sold-out options, with a compact limit", () => {
    const html = renderToStaticMarkup(<WenzeProductFacts locale="en" compact product={product({
      condition:"new",variants:[variant("XS"),variant("S"),variant("M"),variant("L"),variant("XXL",0)]
    })}/>);
    expect(html).toContain("New"); expect(html).toContain("Sizes");
    expect(html).toContain("XS · S · M +1"); expect(html).not.toContain("XXL");
  });
  it("uses French condition and storage labels for electronics", () => {
    const html = renderToStaticMarkup(<WenzeProductFacts locale="fr" product={product({
      category:"phones_electronics",condition:"like_new",variant_type:"storage",
      variants:[{...variant("128 GB"),variant_type:"storage"}]
    })}/>);
    expect(html).toContain("Comme neuf"); expect(html).toContain("Stockage");
    expect(html).toContain("128 GB"); expect(html).not.toContain("Tailles");
  });
});
