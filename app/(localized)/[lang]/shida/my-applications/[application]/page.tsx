import { notFound } from "next/navigation";
import { CandidateEmploymentWorkspace } from "../../../../../components/shida/candidate-employment";
import { candidateEmploymentMetadata } from "../../../../../lib/employment-metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = candidateEmploymentMetadata("en", true);

export default async function Page({ params }: { params: Promise<{ lang: string; application: string }> }) {
  const { lang, application } = await params;
  if (lang !== "en") notFound();
  return <CandidateEmploymentWorkspace locale="en" applicationReference={application}/>;
}
