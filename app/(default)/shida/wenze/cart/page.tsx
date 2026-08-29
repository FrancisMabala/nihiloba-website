import type { Metadata } from "next";
import { WenzeCartPage } from "../../../../components/shida/wenze-cart-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wenze cart", robots: { index: false, follow: false }, alternates: { canonical: "/shida/wenze/cart" } };

export default function Page() { return <WenzeCartPage locale="en"/>; }
