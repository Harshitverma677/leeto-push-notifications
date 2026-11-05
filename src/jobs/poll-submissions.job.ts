import { env } from "../config/env.js";
import { isAcceptedSubmission, normalizeUsername } from "../domain/submission.js";
import { LeetCodeClient } from "../providers/leetcode.client.js";
import { FirestoreRepository, type TrackedMember } from "../repositories/firestore.repository.js";
import { NotificationService } from "../services/notification.service.js";

export class PollSubmissionsJob {
  constructor(
    private readonly leetcode = new LeetCodeClient(),
    private readonly repository = new FirestoreRepository(),
    private readonly notifications = new NotificationService()
  ) {}

  async runOnce(): Promise<{ usernamesChecked: number; notificationsSent: number; errors: number }> {
    const members = await this.repository.listTrackedMembers();
    const ownersByUsername = new Map<string, TrackedMember[]>();

    for (const member of members) {
      const key = normalizeUsername(member.usernameNormalized || member.username);
      const owners = ownersByUsername.get(key) ?? [];
      if (!owners.some((owner) => owner.ownerUid === member.ownerUid)) owners.push(member);
      ownersByUsername.set(key, owners);
    }

    let notificationsSent = 0;
    let errors = 0;
    let usernamesChecked = 0;

    for (const [usernameNormalized, owners] of ownersByUsername) {
      const username = owners[0].username;
      usernamesChecked += 1;

      try {
        const submissions = await this.leetcode.getRecentAcceptedSubmissions(
          username,
          env.MAX_SUBMISSION_LOOKBACK
        );
        const accepted = submissions
          .filter(isAcceptedSubmission)
          .sort((a, b) => a.timestamp - b.timestamp);

        const baseline = await this.repository.getUsernameBaseline(usernameNormalized);
        if (baseline === null) {
          const latestTimestamp = accepted.reduce((latest, item) => Math.max(latest, item.timestamp), 0);
          await this.repository.setUsernameBaseline(usernameNormalized, latestTimestamp);
          console.log(`[poll] Established initial baseline for ${username}; no historical notifications sent.`);
          continue;
        }

        const newSubmissions = accepted.filter((submission) => submission.timestamp > baseline);
        for (const submission of newSubmissions) {
          for (const owner of owners) {
            const claimed = await this.repository.claimSubmission(owner.ownerUid, submission.id);
            if (!claimed) continue;

            try {
              const tokens = await this.repository.getDeviceTokens(owner.ownerUid);
              if (tokens.length === 0) {
                await this.repository.markSubmissionSent(owner.ownerUid, submission.id, 0);
                continue;
              }
              const successCount = await this.notifications.sendAcceptedSubmission(tokens, submission);
              await this.repository.markSubmissionSent(owner.ownerUid, submission.id, successCount);
              notificationsSent += successCount;
            } catch (error) {
              await this.repository.releaseSubmissionClaim(owner.ownerUid, submission.id);
              throw error;
            }
          }
        }

        if (accepted.length > 0) {
          const latestTimestamp = accepted.reduce((latest, item) => Math.max(latest, item.timestamp), baseline);
          if (latestTimestamp > baseline) {
            await this.repository.setUsernameBaseline(usernameNormalized, latestTimestamp);
          }
        }
      } catch (error) {
        errors += 1;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[poll] Failed for ${username}: ${message}`);
        await this.repository.recordPollError(username, message).catch((logError) => {
          console.error("[poll] Could not persist worker error:", logError);
        });
      }
    }

    return { usernamesChecked, notificationsSent, errors };
  }
}
