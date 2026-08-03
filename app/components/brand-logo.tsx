import Image from "next/image";

type BrandLogoProps = { brand?: "nihiloba" | "shida"; className?: string; eager?: boolean };

export function BrandLogo({ brand = "nihiloba", className = "", eager = false }: BrandLogoProps) {
  const nihiloba = brand === "nihiloba";
  return (
    <Image
      src={nihiloba ? "/NIHILOBA_logo.png" : "/shida-logo.png"}
      alt={nihiloba ? "NIHILOBA — Racines, Impact, Avenir" : "SHIDA"}
      width={1536}
      height={1024}
      className={`brand-image ${className}`}
      sizes={nihiloba ? "(max-width: 700px) 180px, 250px" : "(max-width: 700px) 220px, 340px"}
      preload={eager}
    />
  );
}
