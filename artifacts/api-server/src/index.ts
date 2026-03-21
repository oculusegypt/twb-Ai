import app from "./app";
import { sendDuePushJobs } from "./routes/push";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);

  // Run push job scheduler every 60 seconds
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    setInterval(() => {
      sendDuePushJobs().catch((err) => console.error("[push-scheduler]", err));
    }, 60_000);
    // Run immediately on start to catch any missed jobs
    sendDuePushJobs().catch((err) => console.error("[push-scheduler-init]", err));
  }
});
