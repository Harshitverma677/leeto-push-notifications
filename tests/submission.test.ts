import { describe, expect, it } from "vitest";
import { isAcceptedSubmission, normalizeUsername } from "../src/domain/submission.js";

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
});
