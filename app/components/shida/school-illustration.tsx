import Image from "next/image";

/** Exact approved artwork, losslessly encoded; decorative, not a listed school. */
export function SchoolIllustration() {
  return <Image className="school-illustration" src="/images/ecole/approved-school-drc.webp" width={1448} height={1086} alt="" aria-hidden="true" unoptimized preload />;
}
