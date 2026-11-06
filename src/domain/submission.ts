export interface LeetCodeSubmission {
  id: string;
  username: string;
  displayName?: string;
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

export function formatSubmissionNotification(submission: LeetCodeSubmission): {
  title: string;
  body: string;
  displayName: string;
} {
  const displayName = submission.displayName?.trim() || submission.username;
  return {
    title: "Leetcode submission",
    body: `${displayName} solved ${submission.title}`,
    displayName
  };
}
