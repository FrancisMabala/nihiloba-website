import { RestaurantSeller } from "@/app/components/shida/restaurant-seller";
import { isRestaurantLocale } from "@/app/lib/restaurant-i18n";
import { sellerChrome } from "@/app/lib/restaurant-seller-copy";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props) {
 const { lang } = await params; if (!isRestaurantLocale(lang)) notFound();
 return { title: sellerChrome[lang].title, robots: { index: false, follow: false, noarchive: true } };
}
export default async function Page({ params }: Props) { const { lang } = await params; if (!isRestaurantLocale(lang)) notFound(); return <RestaurantSeller locale={lang}/>; }
