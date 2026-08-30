export type EmploymentApplicationStatus =
  | "received"
  | "under_review"
  | "shortlisted"
  | "interview_proposed"
  | "interview_confirmed"
  | "offered"
  | "hired"
  | "rejected"
  | "withdrawn"
  | "closed";

export type EmploymentStatusHistoryItem = {
  status: EmploymentApplicationStatus;
  created_at: string | null;
  notification_status: string | null;
};

export type EmploymentMessage = {
  sender: "you" | "other" | "system";
  channel: string | null;
  message_type: string | null;
  body: string;
  delivery_status: string | null;
  created_at: string | null;
};

export type CandidateApplication = {
  reference: string;
  job_title: string;
  employer_name: string;
  status: EmploymentApplicationStatus;
  created_at: string | null;
  communication_channel: string | null;
  email_handoff_status: string | null;
  interview: {
    date: string | null;
    time: string | null;
    location: string | null;
    notes: string | null;
    meeting_link: string | null;
  };
  status_history: EmploymentStatusHistoryItem[];
  messages: EmploymentMessage[];
  email_handoff_contact: { recruiter_email: string } | null;
};

export type EmploymentSession = {
  display_name: string;
  account_type: string | null;
};
