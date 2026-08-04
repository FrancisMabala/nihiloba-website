import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, ArrowUpRightIcon } from "./icons";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "text";
  external?: boolean;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
}: ButtonLinkProps) {
  const classes = `button button-${variant} ${className}`;
  const isExternal = external || href.startsWith("http://") || href.startsWith("https://");
  const content = (
    <>
      <span>{children}</span>
      {isExternal ? (
        <ArrowUpRightIcon className="button-icon" />
      ) : (
        <ArrowRightIcon className="button-icon" />
      )}
    </>
  );

  if (isExternal || href.startsWith("mailto:")) {
    return (
      <a
        className={classes}
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link className={classes} href={href}>
      {content}
    </Link>
  );
}
