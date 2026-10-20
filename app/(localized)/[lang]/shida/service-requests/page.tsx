import {notFound} from "next/navigation";
import {PersonalServiceRequests} from "@/app/components/shida/personal-service-requests";
import type {ServiceLocale} from "@/app/lib/services-category-experience";
export const dynamic = "force-dynamic";
export const metadata = {robots: {index: false, follow: false, noarchive: true}};
export default async function Page({params, searchParams}: {
  params: Promise<{lang: string}>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {lang} = await params; if (!["en", "fr", "ln", "sw"].includes(lang)) notFound();
  const query = await searchParams;
  const briefRef = typeof query.brief === "string" && /^SCB_[A-Za-z0-9_-]{1,28}$/.test(query.brief) ? query.brief : undefined;
  const requestRef = typeof query.request === "string" && /^(SPR|SWR)_[A-Za-z0-9_-]{1,28}$/.test(query.request) ? query.request : undefined;
  const bookingRef = typeof query.booking === "string" && /^RSV_[A-Za-z0-9_-]{1,28}$/.test(query.booking) ? query.booking : undefined;
  return <PersonalServiceRequests locale={lang as ServiceLocale} briefRef={briefRef} requestRef={requestRef} bookingRef={bookingRef} newRequest={query.new === "1"}/>;
}
