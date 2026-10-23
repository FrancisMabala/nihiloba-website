import { RegistrationWizard } from "@/app/components/shida/registration-wizard";
import { notFound } from "next/navigation";
import { getRegistrationCatalogs } from "@/app/services/shida/public-client";
export const metadata = { title: "Create your SHIDA account", robots: { index: false, follow: false } };
export default async function Page() { if (process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED !== "true") notFound(); const catalogs = await getRegistrationCatalogs().catch(() => null); return <RegistrationWizard locale="en" catalogs={catalogs} />; }
