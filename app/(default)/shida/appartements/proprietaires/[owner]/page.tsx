import { ApartmentOwnerPage, apartmentOwnerMetadata } from "../../../../../components/shida/marketplace-pages";

export async function generateMetadata({ params }: { params: Promise<{ owner: string }> }) {
  const { owner } = await params;
  return apartmentOwnerMetadata("en", owner);
}

export default async function Page({ params }: { params: Promise<{ owner: string }> }) {
  const { owner } = await params;
  return <ApartmentOwnerPage locale="en" owner={owner}/>;
}
