import type { ReactNode } from "react";
import { ButtonLink } from "./button-link";

type HeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primary?: { href: string; label: string; external?: boolean };
  secondary?: { href: string; label: string };
  visual?: ReactNode;
  compact?: boolean;
};

export function Hero({ eyebrow, title, description, primary, secondary, visual, compact = false }: HeroProps) {
  return (
    <section className={compact ? "hero hero-compact" : "hero"}>
      <div className={`container hero-grid ${visual ? "" : "hero-grid-single"}`}>
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" />{eyebrow}</p>
          <h1>{title}</h1>
          <p className="hero-description">{description}</p>
          {(primary || secondary) && (
            <div className="hero-actions">
              {primary && <ButtonLink href={primary.href} external={primary.external}>{primary.label}</ButtonLink>}
              {secondary && <ButtonLink href={secondary.href} variant="secondary">{secondary.label}</ButtonLink>}
            </div>
          )}
        </div>
        {visual && <div className="hero-visual">{visual}</div>}
      </div>
    </section>
  );
}
