import { ButtonLink } from "./button-link";

type CtaSectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  href?: string;
  label?: string;
};

export function CtaSection({
  eyebrow = "Start a conversation",
  title = "Build, collaborate or learn more.",
  description = "Whether you represent a community, company or institution, we would like to hear what practical access means in your context.",
  href = "/contact",
  label = "Contact NIHILOBA",
}: CtaSectionProps) {
  return (
    <section className="section cta-wrap">
      <div className="container">
        <div className="cta-panel">
          <div className="cta-orb" aria-hidden="true" />
          <div className="cta-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <ButtonLink href={href}>{label}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
