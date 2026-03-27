import { Router } from "express";
import webpush from "web-push";
import { db } from "@workspace/db";
import { pushSubscriptionsTable, pushJobsTable, fcmTokensTable } from "@workspace/db/schema";
import { eq, lte, and } from "drizzle-orm";

const router = Router();

const VAPID_CONFIGURED = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

if (VAPID_CONFIGURED) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:admin@tawbah.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

// GET /push/vapid-public-key
router.get("/vapid-public-key", (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

// POST /push/subscribe
router.post("/subscribe", async (req, res) => {
  const { sessionId, subscription } = req.body;
  if (!sessionId || !subscription?.endpoint) {
    return res.status(400).json({ error: "Missing sessionId or subscription" });
  }
  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys || {};
  if (!p256dh || !auth) {
    return res.status(400).json({ error: "Missing subscription keys" });
  }
  await db
    .insert(pushSubscriptionsTable)
    .values({ sessionId, endpoint, p256dh, auth })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.sessionId,
      set: { endpoint, p256dh, auth, updatedAt: new Date() },
    });
  res.json({ ok: true });
});

// POST /push/schedule
router.post("/schedule", async (req, res) => {
  const { sessionId, jobs } = req.body;
  if (!sessionId || !Array.isArray(jobs)) {
    return res.status(400).json({ error: "Missing sessionId or jobs" });
  }
  if (jobs.length === 0) {
    return res.json({ ok: true, count: 0 });
  }
  const rows = jobs.map((j: { type?: string; title: string; body: string; url?: string; fireAt: string }) => ({
    sessionId,
    type: j.type || "custom",
    title: j.title,
    body: j.body,
    url: j.url || "/",
    fireAt: new Date(j.fireAt),
    sent: false,
  }));
  await db.insert(pushJobsTable).values(rows);
  res.json({ ok: true, count: rows.length });
});

// POST /push/fcm-token — register FCM token for Android native push
router.post("/fcm-token", async (req, res) => {
  const { sessionId, token, platform } = req.body as { sessionId?: string; token?: string; platform?: string };
  if (!sessionId || !token) {
    return res.status(400).json({ error: "Missing sessionId or token" });
  }
  try {
    await db
      .insert(fcmTokensTable)
      .values({ sessionId, token, platform: platform ?? "android" })
      .onConflictDoUpdate({
        target: fcmTokensTable.sessionId,
        set: { token, platform: platform ?? "android", updatedAt: new Date() },
      });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// DELETE /push/jobs  — clear pending jobs for a session (before rescheduling)
router.delete("/jobs", async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
  await db
    .delete(pushJobsTable)
    .where(and(eq(pushJobsTable.sessionId, sessionId), eq(pushJobsTable.sent, false)));
  res.json({ ok: true });
});

// Internal: send due push notifications (called by scheduler)
export async function sendDuePushJobs() {
  if (!VAPID_CONFIGURED) return;
  const now = new Date();
  const dueJobs = await db.query.pushJobsTable.findMany({
    where: and(eq(pushJobsTable.sent, false), lte(pushJobsTable.fireAt, now)),
  });
  if (dueJobs.length === 0) return;

  for (const job of dueJobs) {
    const sub = await db.query.pushSubscriptionsTable.findFirst({
      where: eq(pushSubscriptionsTable.sessionId, job.sessionId),
    });
    if (!sub) {
      await db
        .update(pushJobsTable)
        .set({ sent: true })
        .where(eq(pushJobsTable.id, job.id));
      continue;
    }
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: job.title,
          body: job.body,
          url: job.url,
          tag: `job-${job.id}`,
        })
      );
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) {
        await db
          .delete(pushSubscriptionsTable)
          .where(eq(pushSubscriptionsTable.sessionId, job.sessionId));
      }
    } finally {
      await db
        .update(pushJobsTable)
        .set({ sent: true })
        .where(eq(pushJobsTable.id, job.id));
    }
  }
}

export default router;
