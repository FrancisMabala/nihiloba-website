import { RestaurantSeller } from "@/app/components/shida/restaurant-seller";
export const dynamic = "force-dynamic";
export const metadata = { title: "Personal seller · SHIDA", robots: { index: false, follow: false, noarchive: true } };
export default function Page() { return <RestaurantSeller locale="en"/>; }
