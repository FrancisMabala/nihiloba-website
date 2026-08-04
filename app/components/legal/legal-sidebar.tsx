"use client";

import { useEffect, useState } from "react";

export type LegalNavItem = { id: string; label: string };

export function LegalSidebar({ items, label }: { items: readonly LegalNavItem[]; label: string }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.1, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  const links = items.map((item) => (
    <a key={item.id} href={`#${item.id}`} className={activeId === item.id ? "legal-toc-active" : ""} aria-current={activeId === item.id ? "location" : undefined}>
      {item.label}
    </a>
  ));

  return (
    <>
      <aside className="legal-sidebar">
        <p>{label}</p>
        <nav aria-label={label}>{links}</nav>
      </aside>
      <details className="legal-mobile-toc">
        <summary>{label}</summary>
        <nav aria-label={label}>{links}</nav>
      </details>
    </>
  );
}
