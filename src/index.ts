import express from "express";
import { timingSafeEqual } from "node:crypto";
import { env } from "./config/env.js";
import { PollSubmissionsJob } from "./jobs/poll-submissions.job.js";

const app = express();
const job = new PollSubmissionsJob();
let pollRunning = false;

function hasValidSecret(header: string | undefined): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice(7));
  const expected = Buffer.from(env.POLL_SECRET);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok", service: "leeto-push-notifications" });
});

app.post("/internal/run-poll", async (request, response) => {
  if (!hasValidSecret(request.header("authorization"))) {
    response.status(401).json({ error: "unauthorized" });
    return;
  }
  if (pollRunning) {
    response.status(409).json({ status: "already_running" });
    return;
  }

  pollRunning = true;
  try {
    const result = await job.runOnce();
    response.status(200).json({ status: "completed", ...result });
  } catch (error) {
    console.error("[poll] Job failed:", error);
    response.status(500).json({ status: "failed" });
  } finally {
    pollRunning = false;
  }
});

app.listen(env.PORT, () => {
  console.log(`LEETO notification backend listening on port ${env.PORT}`);
});
