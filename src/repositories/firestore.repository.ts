import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase.js";
import { normalizeUsername } from "../domain/submission.js";

export interface TrackedMember {
  ownerUid: string;
  username: string;
  usernameNormalized: string;
  memberId: string;
}

export interface UsernameBaseline {
  timestamp: number;
  submissionIds: string[];
}

export class FirestoreRepository {
  async listTrackedMembers(): Promise<TrackedMember[]> {
    const members = await db.collectionGroup("members").get();
    return members.docs.flatMap((doc) => {
      const data = doc.data();
      const ownerUid = typeof data.ownerUid === "string" ? data.ownerUid : doc.ref.parent.parent?.id;
      const username = typeof data.leetCodeUsername === "string" ? data.leetCodeUsername.trim() : "";
      if (!ownerUid || !username) return [];
      return [{
        ownerUid,
        username,
        usernameNormalized: typeof data.leetCodeUsernameNormalized === "string"
          ? normalizeUsername(data.leetCodeUsernameNormalized)
          : normalizeUsername(username),
        memberId: doc.id
      }];
    });
  }

  async getDeviceTokens(ownerUid: string): Promise<string[]> {
    const snapshot = await db.collection("users").doc(ownerUid).get();
    const tokens = snapshot.get("fcmTokens");
    return Array.isArray(tokens)
      ? [...new Set(tokens.filter((token): token is string => typeof token === "string" && token.length > 0))]
      : [];
  }

  async getUsernameBaseline(usernameNormalized: string): Promise<UsernameBaseline | null> {
    const snapshot = await db.collection("leetcodePollingState").doc(usernameNormalized).get();
    const timestamp = snapshot.get("latestAcceptedTimestamp");
    if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return null;
    const ids = snapshot.get("latestAcceptedSubmissionIds");
    return {
      timestamp,
      submissionIds: Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []
    };
  }

  async setUsernameBaseline(usernameNormalized: string, timestamp: number, submissionIds: string[]): Promise<void> {
    await db.collection("leetcodePollingState").doc(usernameNormalized).set({
      latestAcceptedTimestamp: timestamp,
      latestAcceptedSubmissionIds: submissionIds,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }

  async claimSubmission(ownerUid: string, submissionId: string): Promise<boolean> {
    const ref = db.collection("notificationDedupe").doc(`${ownerUid}_${submissionId}`);
    try {
      await ref.create({
        ownerUid,
        submissionId,
        status: "claimed",
        createdAt: FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      const code = (error as { code?: number | string }).code;
      if (code === 6 || code === "already-exists") return false;
      throw error;
    }
  }

  async markSubmissionSent(ownerUid: string, submissionId: string, successCount: number): Promise<void> {
    await db.collection("notificationDedupe").doc(`${ownerUid}_${submissionId}`).set({
      status: "sent",
      successCount,
      sentAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }

  async releaseSubmissionClaim(ownerUid: string, submissionId: string): Promise<void> {
    await db.collection("notificationDedupe").doc(`${ownerUid}_${submissionId}`).delete();
  }

  async recordPollError(username: string, message: string): Promise<void> {
    await db.collection("notificationWorkerErrors").add({
      username,
      message: message.slice(0, 1000),
      createdAt: Timestamp.now()
    });
  }
}
