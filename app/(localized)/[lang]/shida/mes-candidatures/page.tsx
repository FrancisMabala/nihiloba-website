import { notFound } from "next/navigation";
import { CandidateEmploymentWorkspace } from "../../../../components/shida/candidate-employment";
import { candidateEmploymentMetadata } from "../../../../lib/employment-metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = candidateEmploymentMetadata("fr");

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  if ((await params).lang !== "fr") notFound();
  return <CandidateEmploymentWorkspace locale="fr"/>;
}
