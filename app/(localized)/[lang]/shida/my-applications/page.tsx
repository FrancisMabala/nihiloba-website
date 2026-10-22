import { notFound } from "next/navigation";
import { CandidateEmploymentWorkspace } from "../../../../components/shida/candidate-employment";
import { candidateEmploymentMetadata } from "../../../../lib/employment-metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = candidateEmploymentMetadata("en");

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const {lang}=await params;
  if (lang!=="en"&&lang!=="ln"&&lang!=="sw") notFound();
  return <CandidateEmploymentWorkspace locale={lang}/>;
}
