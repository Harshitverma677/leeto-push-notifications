import { env } from "../config/env.js";
import { isAcceptedSubmission, normalizeUsername } from "../domain/submission.js";
import { LeetCodeClient } from "../providers/leetcode.client.js";
import { FirestoreRepository } from "../repositories/firestore.repository.js";
import { NotificationService } from "../services/notification.service.js";

export class PollSubmissionsJob {
  constructor(
    private readonly leetcode = new LeetCodeClient(),
    private readonly repository = new FirestoreRepository(),
    private readonly notifications = new NotificationService()
  ) {}

  async runOnce(): Promise<{ membersChecked: number; notificationsSent: number; errors: number }> {
    const members = await this.repository.listTrackedMembers();
    const uniqueMembers = new Map<string, typeof members[number]>();
    for (const member of members) {
      uniqueMembers.set(member.usernameNormalized || normalizeUsername(member.username), member);
    }

    let notificationsSent = 0;
    let errors = 0;
    let membersChecked = 0;

    for (const member of uniqueMembers.values()) {
      membersChecked += 1;
      try {
        const submissions = await this.leetcode.getRecentAcceptedSubmissions(
          member.username,
          env.MAX_SUBMISSION_LOOKBACK
        );

        for (const submission of submissions) {
          if (!isAcceptedSubmission(submission)) continue;
          const claimed = await this.repository.claimSubmission(member.ownerUid, submission.id);
          if (!claimed) continue;

          try {
            const tokens = await this.repository.getDeviceTokens(member.ownerUid);
            if (tokens.length === 0) {
              await this.repository.markSubmissionSent(member.ownerUid, submission.id, 0);
              continue;
            }
            const delivered = await this.notifications.sendAcceptedSubmission(tokens, submission);
            await this.repository.markSubmissionSent(member.ownerUid, submission.id, delivered);
            notificationsSent += delivered;
          } catch (error) {
            await this.repository.releaseSubmissionClaim(member.ownerUid, submission.id);
            throw error;
          }
        }
      } catch (error) {
        errors += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[poll] Failed for ${member.username}: ${message}`);
        await this.repository.recordPollError(member.username, message).catch((logError) => {
          console.error("[poll] Could not persist worker error:", logError);
        });
      }
    }

    return { membersChecked, notificationsSent, errors };
  }
}
