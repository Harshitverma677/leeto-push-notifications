import { describe, expect, it } from "vitest";
import {
  formatSubmissionNotification,
  isAcceptedSubmission,
  normalizeUsername
} from "../src/domain/submission.js";

describe("submission filtering", () => {
  const base = {
    id: "123",
    username: "harshit",
    title: "Two Sum",
    titleSlug: "two-sum",
    timestamp: 1,
    url: "https://leetcode.com/problems/two-sum/"
  };

  it("accepts Accepted status", () => {
    expect(isAcceptedSubmission({ ...base, statusDisplay: "Accepted" })).toBe(true);
  });

  it.each(["Wrong Answer", "Time Limit Exceeded", "Runtime Error", "Compile Error"])(
    "rejects %s",
    (statusDisplay) => {
      expect(isAcceptedSubmission({ ...base, statusDisplay })).toBe(false);
    }
  );

  it("normalizes usernames", () => {
    expect(normalizeUsername("  Harshit  ")).toBe("harshit");
  });

  describe("notification formatting", () => {
    it("uses displayName when provided", () => {
      const formatted = formatSubmissionNotification({
        ...base,
        statusDisplay: "Accepted",
        displayName: "Abhay Pratap Singh"
      });
      expect(formatted.displayName).toBe("Abhay Pratap Singh");
      expect(formatted.body).toBe("Abhay Pratap Singh solved Two Sum");
      expect(formatted.title).toBe("Accepted submission 🎉");
    });

    it("falls back to username when displayName is undefined", () => {
      const formatted = formatSubmissionNotification({
        ...base,
        statusDisplay: "Accepted"
      });
      expect(formatted.displayName).toBe("harshit");
      expect(formatted.body).toBe("harshit solved Two Sum");
    });

    it("falls back to username when displayName is empty string or only whitespace", () => {
      const formatted = formatSubmissionNotification({
        ...base,
        statusDisplay: "Accepted",
        displayName: "   "
      });
      expect(formatted.displayName).toBe("harshit");
      expect(formatted.body).toBe("harshit solved Two Sum");
    });
  });
});
