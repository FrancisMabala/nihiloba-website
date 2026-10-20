import {PersonalServiceRequests} from "@/app/components/shida/personal-service-requests";
export const dynamic = "force-dynamic";
export const metadata = {title: "My service requests · SHIDA", robots: {index: false, follow: false, noarchive: true}};
export default async function Page({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const query = await searchParams;
  const briefRef = typeof query.brief === "string" && /^SCB_[A-Za-z0-9_-]{1,28}$/.test(query.brief) ? query.brief : undefined;
  const requestRef = typeof query.request === "string" && /^(SPR|SWR)_[A-Za-z0-9_-]{1,28}$/.test(query.request) ? query.request : undefined;
  const bookingRef = typeof query.booking === "string" && /^RSV_[A-Za-z0-9_-]{1,28}$/.test(query.booking) ? query.booking : undefined;
  return <PersonalServiceRequests locale="en" briefRef={briefRef} requestRef={requestRef} bookingRef={bookingRef} newRequest={query.new === "1"}/>;
}
