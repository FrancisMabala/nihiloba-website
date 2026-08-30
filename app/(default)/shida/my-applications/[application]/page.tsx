import { CandidateEmploymentWorkspace } from "../../../../components/shida/candidate-employment";
import { candidateEmploymentMetadata } from "../../../../lib/employment-metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = candidateEmploymentMetadata("en", true);

export default async function Page({ params }: { params: Promise<{ application: string }> }) {
  return <CandidateEmploymentWorkspace locale="en" applicationReference={(await params).application}/>;
}
