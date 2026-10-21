import {PersonalServiceRequests} from "@/app/components/shida/personal-service-requests";
import {notFound} from "next/navigation";
export const dynamic = "force-dynamic";
export const metadata = {title: "My service requests · SHIDA", robots: {index: false, follow: false, noarchive: true}};
export default async function Page({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const query = await searchParams;
  const directRef = typeof query.service === "string" && /^SVC_[A-Za-z0-9_-]{1,28}$/.test(query.service) ? query.service : undefined;
  if (query.service !== undefined && !directRef) notFound();
  const briefRef = typeof query.brief === "string" && /^SCB_[A-Za-z0-9_-]{1,28}$/.test(query.brief) ? query.brief : undefined;
  const requestRef = typeof query.request === "string" && /^(SPR|SWR)_[A-Za-z0-9_-]{1,28}$/.test(query.request) ? query.request : undefined;
  const bookingRef = typeof query.booking === "string" && /^RSV_[A-Za-z0-9_-]{1,28}$/.test(query.booking) ? query.booking : undefined;
  return <PersonalServiceRequests locale="en" directRef={directRef} briefRef={briefRef} requestRef={requestRef} bookingRef={bookingRef} newRequest={query.new === "1" || !!directRef}/>;
}
