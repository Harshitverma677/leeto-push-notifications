import { messaging } from "../config/firebase.js";
import type { LeetCodeSubmission } from "../domain/submission.js";

export class NotificationService {
  async sendAcceptedSubmission(tokens: string[], submission: LeetCodeSubmission): Promise<number> {
    if (tokens.length === 0) return 0;

    let delivered = 0;
    const chunks: string[][] = [];
    for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));

    for (const chunk of chunks) {
      const result = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: "Accepted submission 🎉",
          body: `${submission.username} solved ${submission.title}`
        },
        data: {
          type: "accepted_submission",
          submissionId: submission.id,
          username: submission.username,
          title: submission.title,
          titleSlug: submission.titleSlug,
          url: submission.url
        },
        android: { priority: "high" }
      });
      delivered += result.successCount;
    }
    return delivered;
  }
}
