import { RegistrationWizard } from "@/app/components/shida/registration-wizard";
import { notFound } from "next/navigation";
export const metadata = { title: "Create your SHIDA account", robots: { index: false, follow: false } };
export default function Page() { if (process.env.NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED !== "true") notFound(); return <RegistrationWizard locale="en" />; }
