import { ShidaPage } from "../../../components/pages/localized-pages";
import { isRestaurantLocale } from "../../../lib/restaurant-i18n";
import { discoveryMetadata } from "../../../lib/discovery-metadata";
export const revalidate = 60;
export async function generateMetadata({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return isRestaurantLocale(lang)?discoveryMetadata(lang):{}; }
export default async function Page({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return <ShidaPage locale={isRestaurantLocale(lang)?lang:"en"}/>; }
