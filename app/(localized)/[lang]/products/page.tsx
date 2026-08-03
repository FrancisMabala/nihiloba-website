import { ProductsPage } from "../../../components/pages/localized-pages";
import { isLocale, pageMetadata } from "../../../lib/i18n";
export async function generateMetadata({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return isLocale(lang)?pageMetadata(lang,"products","/products"):{}; }
export default async function Page({params}:{params:Promise<{lang:string}>}) { const {lang}=await params; return <ProductsPage locale={isLocale(lang)?lang:"en"}/>; }
