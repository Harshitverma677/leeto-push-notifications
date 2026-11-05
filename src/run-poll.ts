import { PollSubmissionsJob } from "./jobs/poll-submissions.job.js";

const job = new PollSubmissionsJob();

try {
  console.log("[poll] Starting scheduled LEETO submission check.");
  const result = await job.runOnce();
  console.log("[poll] Completed:", JSON.stringify(result));

  if (result.errors > 0) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error("[poll] Scheduled run failed:", error);
  process.exitCode = 1;
}
