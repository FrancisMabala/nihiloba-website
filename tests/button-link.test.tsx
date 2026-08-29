import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ButtonLink } from "../app/components/button-link";

describe("ButtonLink", () => {
  it("keeps absolute NIHILOBA website links in the same tab", () => {
    const html = renderToStaticMarkup(
      <ButtonLink href="https://nihiloba.com/shida/wenze/example-shop">View shop</ButtonLink>,
    );

    expect(html).toContain('href="/shida/wenze/example-shop"');
    expect(html).not.toContain('target="_blank"');
    expect(html).not.toContain('rel="noopener noreferrer"');
  });

  it("continues to open genuinely external links securely", () => {
    const html = renderToStaticMarkup(
      <ButtonLink href="https://wa.me/example">Open on SHIDA</ButtonLink>,
    );

    expect(html).toContain('href="https://wa.me/example"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
