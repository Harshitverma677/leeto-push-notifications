import express from "express";
import { env } from "./config/env.js";
import { PollSubmissionsJob } from "./jobs/poll-submissions.job.js";

const app = express();
const job = new PollSubmissionsJob();
let pollRunning = false;

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok", service: "leeto-push-notifications" });
});

app.post("/internal/run-poll", async (_request, response) => {
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
