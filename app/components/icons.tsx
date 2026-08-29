import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: 1.7,
  stroke: "currentColor",
  "aria-hidden": true,
} as const;

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5 5 5-5 5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7m4 4v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7m14-2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2.4a17 17 0 0 0 14 0V9ZM10 12h4" />
    </svg>
  );
}

export function ToolsIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.7 6.3 3-3a4 4 0 0 1-5.1 5.1l-6.8 6.8a2 2 0 1 0 2.8 2.8l6.8-6.8a4 4 0 0 1 5.1-5.1l-3 3-2.8-2.8Z" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 11 9-8 9 8M5.5 9.5V20h13V9.5M9 20v-6h6v6" />
    </svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 16-1.3-1.3A2.4 2.4 0 0 1 3 13v-2h18v2a2.4 2.4 0 0 1-.7 1.7L19 16m-14 0v2m14-2v2M6 11l1.7-5h8.6l1.7 5M7 15h.01M17 15h.01" />
    </svg>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 9.5c.7 2.3 2 3.6 4.5 4.5l1.2-1.2c.3-.3.7-.3 1-.2l1.3.5" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3.5 9h17M3.5 15h17M12 3c2 2.3 3 5.3 3 9s-1 6.7-3 9c-2-2.3-3-5.3-3-9s1-6.7 3-9Z" />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </svg>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10v10h16V10M3 10l2-6h14l2 6M8 20v-6h8v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.1 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6" />
      <circle cx="10" cy="20" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function QrCodeIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2v2h-2v-2Zm4 0h2v4h-2v-4Zm-4 4h4v2h-4v-2Z" />
    </svg>
  );
}

export function LightbulbIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6m-5 3h4m3-11a5 5 0 1 0-8.2 3.8A3.5 3.5 0 0 1 10 16h4a3.5 3.5 0 0 1 1.2-2.2A5 5 0 0 0 17 10Z" />
    </svg>
  );
}
