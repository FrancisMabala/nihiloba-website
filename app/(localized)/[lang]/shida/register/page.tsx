import { notFound } from "next/navigation";
import { RegistrationWizard } from "@/app/components/shida/registration-wizard";
import type { RegistrationLocale } from "@/app/lib/registration/copy";
import { getRegistrationCatalogs } from "@/app/services/shida/public-client";
export const metadata = { title: "SHIDA · Inscription", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED !== "true" || !["en", "fr", "ln", "sw"].includes(lang)) notFound();
  const catalogs = await getRegistrationCatalogs().catch(() => null);
  return <RegistrationWizard locale={lang as RegistrationLocale} catalogs={catalogs} />;
}
