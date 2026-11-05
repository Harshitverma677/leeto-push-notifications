import type { LeetCodeSubmission } from "../domain/submission.js";

const endpoint = "https://leetcode.com/graphql";

const recentSubmissionsQuery = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
      lang
    }
  }
`;

interface RecentAcResponse {
  data?: {
    recentAcSubmissionList?: Array<{
      id: string;
      title: string;
      titleSlug: string;
      timestamp: string;
      lang: string;
    }> | null;
  };
  errors?: Array<{ message: string }>;
}

export class LeetCodeClient {
  async getRecentAcceptedSubmissions(username: string, limit: number): Promise<LeetCodeSubmission[]> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "LEETO-notification-service/1.0"
      },
      body: JSON.stringify({
        query: recentSubmissionsQuery,
        variables: { username, limit }
      }),
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) {
      throw new Error(`LeetCode returned HTTP ${response.status} for ${username}.`);
    }

    const payload = await response.json() as RecentAcResponse;
    if (payload.errors?.length) {
      throw new Error(`LeetCode GraphQL error: ${payload.errors.map((e) => e.message).join("; ")}`);
    }

    return (payload.data?.recentAcSubmissionList ?? []).map((item) => ({
      id: String(item.id),
      username,
      title: item.title,
      titleSlug: item.titleSlug,
      statusDisplay: "Accepted",
      timestamp: Number(item.timestamp),
      lang: item.lang,
      url: `https://leetcode.com/problems/${item.titleSlug}/`
    }));
  }
}
