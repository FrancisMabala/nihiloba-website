import { CandidateEmploymentWorkspace } from "../../../components/shida/candidate-employment";
import { candidateEmploymentMetadata } from "../../../lib/employment-metadata";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = candidateEmploymentMetadata("en");

export default function Page() { return <CandidateEmploymentWorkspace locale="en"/>; }
