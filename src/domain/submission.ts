export interface LeetCodeSubmission {
  id: string;
  username: string;
  title: string;
  titleSlug: string;
  statusDisplay: string;
  timestamp: number;
  lang?: string;
  url: string;
}

export function isAcceptedSubmission(submission: LeetCodeSubmission): boolean {
  return submission.statusDisplay.trim().toLowerCase() === "accepted";
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
