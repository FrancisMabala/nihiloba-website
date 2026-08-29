import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, ArrowUpRightIcon } from "./icons";

const WEBSITE_ORIGIN = "https://nihiloba.com";

function absoluteHttpUrl(href: string): URL | null {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

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
  const absoluteUrl = absoluteHttpUrl(href);
  const isSameWebsite = absoluteUrl?.origin === WEBSITE_ORIGIN;
  const isExternal = external || Boolean(absoluteUrl && !isSameWebsite);
  const linkHref = isSameWebsite && !external
    ? `${absoluteUrl.pathname}${absoluteUrl.search}${absoluteUrl.hash}`
    : href;
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
    <Link className={classes} href={linkHref}>
      {content}
    </Link>
  );
}
