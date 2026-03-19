import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  userProgressTable,
  habitsTable,
  dhikrCountTable,
  kaffarahStepsTable,
  journalEntriesTable,
  globalStatsTable,
  challengesTable,
  secretDuasTable,
  communityDuasTable,
} from "@workspace/db/schema";
import { eq, and, desc, count, gte, sql, ne, isNull, or } from "drizzle-orm";
import {
  GetUserProgressResponse,
  UpdateUserProgressBody,
  CreateCovenantBody,
  CompleteHabitBody,
  IncrementDhikrBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const TODAY_HABITS = [
  { key: "wudu", nameAr: "توضأ الآن" },
  { key: "salat_tawba", nameAr: "صلِّ ركعتين بنية التوبة" },
  { key: "delete_apps", nameAr: "احذف التطبيقات المحرمة" },
  { key: "change_env", nameAr: "غيّر بيئتك" },
];

const DAILY_HABITS = [
  { key: "istighfar_100", nameAr: "ورد الاستغفار (100 مرة)" },
  { key: "quran", nameAr: "قراءة صفحتين من القرآن" },
  { key: "witr", nameAr: "صلاة الوتر" },
  { key: "sayyid_morning", nameAr: "سيد الاستغفار صباحاً" },
  { key: "sayyid_evening", nameAr: "سيد الاستغفار مساءً" },
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

router.get("/user/progress", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  let progress = await db.query.userProgressTable.findFirst({
    where: eq(userProgressTable.sessionId, sessionId),
  });

  if (!progress) {
    const [created] = await db
      .insert(userProgressTable)
      .values({
        sessionId,
        sinCategory: "other",
        covenantSigned: false,
        currentPhase: 1,
        day40Progress: 0,
        firstDayTasksCompleted: false,
        streakDays: 0,
      })
      .returning();
    progress = created;
  }

  const formatted = {
    id: progress.id,
    sessionId: progress.sessionId,
    sinCategory: progress.sinCategory,
    covenantSigned: progress.covenantSigned,
    covenantDate: progress.covenantDate ? progress.covenantDate.toISOString() : null,
    currentPhase: progress.currentPhase,
    day40Progress: progress.day40Progress,
    firstDayTasksCompleted: progress.firstDayTasksCompleted,
    streakDays: progress.streakDays,
    lastActiveDate: progress.lastActiveDate ?? null,
  };

  res.json(GetUserProgressResponse.parse(formatted));
});

router.put("/user/progress", async (req, res) => {
  const body = UpdateUserProgressBody.parse(req.body);

  let progress = await db.query.userProgressTable.findFirst({
    where: eq(userProgressTable.sessionId, body.sessionId),
  });

  if (!progress) {
    const [created] = await db
      .insert(userProgressTable)
      .values({
        sessionId: body.sessionId,
        sinCategory: "other",
        covenantSigned: false,
        currentPhase: body.currentPhase ?? 1,
        day40Progress: body.day40Progress ?? 0,
        firstDayTasksCompleted: body.firstDayTasksCompleted ?? false,
        streakDays: body.streakDays ?? 0,
        lastActiveDate: todayStr(),
      })
      .returning();
    progress = created;
  } else {
    const updates: Record<string, unknown> = { lastActiveDate: todayStr() };
    if (body.currentPhase !== undefined) updates.currentPhase = body.currentPhase;
    if (body.day40Progress !== undefined) updates.day40Progress = body.day40Progress;
    if (body.firstDayTasksCompleted !== undefined) updates.firstDayTasksCompleted = body.firstDayTasksCompleted;
    if (body.streakDays !== undefined) updates.streakDays = body.streakDays;

    const [updated] = await db
      .update(userProgressTable)
      .set(updates)
      .where(eq(userProgressTable.sessionId, body.sessionId))
      .returning();
    progress = updated;
  }

  const formatted = {
    id: progress.id,
    sessionId: progress.sessionId,
    sinCategory: progress.sinCategory,
    covenantSigned: progress.covenantSigned,
    covenantDate: progress.covenantDate ? progress.covenantDate.toISOString() : null,
    currentPhase: progress.currentPhase,
    day40Progress: progress.day40Progress,
    firstDayTasksCompleted: progress.firstDayTasksCompleted,
    streakDays: progress.streakDays,
    lastActiveDate: progress.lastActiveDate ?? null,
  };

  res.json(formatted);
});

router.post("/user/covenant", async (req, res) => {
  const body = CreateCovenantBody.parse(req.body);

  let progress = await db.query.userProgressTable.findFirst({
    where: eq(userProgressTable.sessionId, body.sessionId),
  });

  if (!progress) {
    const [created] = await db
      .insert(userProgressTable)
      .values({
        sessionId: body.sessionId,
        sinCategory: body.sinCategory,
        covenantSigned: true,
        covenantDate: new Date(),
        currentPhase: 2,
        day40Progress: 0,
        firstDayTasksCompleted: false,
        streakDays: 0,
        lastActiveDate: todayStr(),
      })
      .returning();
    progress = created;
  } else {
    const [updated] = await db
      .update(userProgressTable)
      .set({
        sinCategory: body.sinCategory,
        covenantSigned: true,
        covenantDate: new Date(),
        currentPhase: 2,
        lastActiveDate: todayStr(),
      })
      .where(eq(userProgressTable.sessionId, body.sessionId))
      .returning();
    progress = updated;
  }

  const formatted = {
    id: progress.id,
    sessionId: progress.sessionId,
    sinCategory: progress.sinCategory,
    covenantSigned: progress.covenantSigned,
    covenantDate: progress.covenantDate ? progress.covenantDate.toISOString() : null,
    currentPhase: progress.currentPhase,
    day40Progress: progress.day40Progress,
    firstDayTasksCompleted: progress.firstDayTasksCompleted,
    streakDays: progress.streakDays,
    lastActiveDate: progress.lastActiveDate ?? null,
  };

  res.json(formatted);
});

router.get("/habits", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const dateStr = (req.query.date as string) || todayStr();
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const progress = await db.query.userProgressTable.findFirst({
    where: eq(userProgressTable.sessionId, sessionId),
  });

  const habitTemplates = progress?.firstDayTasksCompleted ? DAILY_HABITS : TODAY_HABITS;

  let habits = await db.query.habitsTable.findMany({
    where: and(
      eq(habitsTable.sessionId, sessionId),
      eq(habitsTable.date, dateStr)
    ),
  });

  if (habits.length === 0) {
    const inserted = await db
      .insert(habitsTable)
      .values(
        habitTemplates.map((h) => ({
          sessionId,
          habitKey: h.key,
          habitNameAr: h.nameAr,
          completed: false,
          date: dateStr,
        }))
      )
      .returning();
    habits = inserted;
  }

  res.json(habits.map((h) => ({
    id: h.id,
    sessionId: h.sessionId,
    habitKey: h.habitKey,
    habitNameAr: h.habitNameAr,
    completed: h.completed,
    date: h.date,
  })));
});

router.post("/habits", async (req, res) => {
  const body = CompleteHabitBody.parse(req.body);
  const dateStr = todayStr();

  const existing = await db.query.habitsTable.findFirst({
    where: and(
      eq(habitsTable.sessionId, body.sessionId),
      eq(habitsTable.habitKey, body.habitKey),
      eq(habitsTable.date, dateStr)
    ),
  });

  if (!existing) {
    return res.status(404).json({ error: "Habit not found" });
  }

  const [updated] = await db
    .update(habitsTable)
    .set({ completed: body.completed })
    .where(and(
      eq(habitsTable.sessionId, body.sessionId),
      eq(habitsTable.habitKey, body.habitKey),
      eq(habitsTable.date, dateStr)
    ))
    .returning();

  res.json({
    id: updated.id,
    sessionId: updated.sessionId,
    habitKey: updated.habitKey,
    habitNameAr: updated.habitNameAr,
    completed: updated.completed,
    date: updated.date,
  });
});

router.get("/dhikr/count", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const dateStr = (req.query.date as string) || todayStr();
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  let dhikr = await db.query.dhikrCountTable.findFirst({
    where: and(
      eq(dhikrCountTable.sessionId, sessionId),
      eq(dhikrCountTable.date, dateStr)
    ),
  });

  if (!dhikr) {
    const [created] = await db
      .insert(dhikrCountTable)
      .values({ sessionId, date: dateStr, istighfar: 0, tasbih: 0, sayyid: 0 })
      .returning();
    dhikr = created;
  }

  res.json({
    sessionId: dhikr.sessionId,
    date: dhikr.date,
    istighfar: dhikr.istighfar,
    tasbih: dhikr.tasbih,
    sayyid: dhikr.sayyid,
  });
});

router.post("/dhikr/increment", async (req, res) => {
  const body = IncrementDhikrBody.parse(req.body);
  const dateStr = todayStr();

  let dhikr = await db.query.dhikrCountTable.findFirst({
    where: and(
      eq(dhikrCountTable.sessionId, body.sessionId),
      eq(dhikrCountTable.date, dateStr)
    ),
  });

  if (!dhikr) {
    const [created] = await db
      .insert(dhikrCountTable)
      .values({ sessionId: body.sessionId, date: dateStr, istighfar: 0, tasbih: 0, sayyid: 0 })
      .returning();
    dhikr = created;
  }

  const col = body.dhikrType as "istighfar" | "tasbih" | "sayyid";
  const newVal = (dhikr[col] ?? 0) + body.amount;

  const updateData: Record<string, number> = {};
  updateData[col] = newVal;

  const [updated] = await db
    .update(dhikrCountTable)
    .set(updateData)
    .where(and(
      eq(dhikrCountTable.sessionId, body.sessionId),
      eq(dhikrCountTable.date, dateStr)
    ))
    .returning();

  res.json({
    sessionId: updated.sessionId,
    date: updated.date,
    istighfar: updated.istighfar,
    tasbih: updated.tasbih,
    sayyid: updated.sayyid,
  });
});

// ==================== KAFFARAH ROUTES ====================

router.get("/kaffarah", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const steps = await db.query.kaffarahStepsTable.findMany({
    where: eq(kaffarahStepsTable.sessionId, sessionId),
  });

  res.json(steps.map((s) => ({
    id: s.id,
    sessionId: s.sessionId,
    stepKey: s.stepKey,
    completed: s.completed,
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
  })));
});

router.post("/kaffarah/complete", async (req, res) => {
  const { sessionId, stepKey, completed } = req.body as { sessionId: string; stepKey: string; completed: boolean };
  if (!sessionId || !stepKey) return res.status(400).json({ error: "sessionId and stepKey required" });

  const existing = await db.query.kaffarahStepsTable.findFirst({
    where: and(
      eq(kaffarahStepsTable.sessionId, sessionId),
      eq(kaffarahStepsTable.stepKey, stepKey)
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(kaffarahStepsTable)
      .set({ completed, completedAt: completed ? new Date() : null })
      .where(and(
        eq(kaffarahStepsTable.sessionId, sessionId),
        eq(kaffarahStepsTable.stepKey, stepKey)
      ))
      .returning();
    return res.json({ id: updated.id, sessionId: updated.sessionId, stepKey: updated.stepKey, completed: updated.completed, completedAt: updated.completedAt ? updated.completedAt.toISOString() : null });
  }

  const [created] = await db
    .insert(kaffarahStepsTable)
    .values({ sessionId, stepKey, completed, completedAt: completed ? new Date() : null })
    .returning();

  res.json({ id: created.id, sessionId: created.sessionId, stepKey: created.stepKey, completed: created.completed, completedAt: created.completedAt ? created.completedAt.toISOString() : null });
});

// ==================== JOURNAL ROUTES ====================

router.get("/journal", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const entries = await db.query.journalEntriesTable.findMany({
    where: eq(journalEntriesTable.sessionId, sessionId),
    orderBy: [desc(journalEntriesTable.createdAt)],
  });

  res.json(entries.map((e) => ({
    id: e.id,
    sessionId: e.sessionId,
    content: e.content,
    mood: e.mood,
    date: e.date,
    createdAt: e.createdAt ? e.createdAt.toISOString() : null,
  })));
});

router.post("/journal", async (req, res) => {
  const { sessionId, content, mood } = req.body as { sessionId: string; content: string; mood: string };
  if (!sessionId || !content) return res.status(400).json({ error: "sessionId and content required" });

  const dateStr = todayStr();
  const [entry] = await db
    .insert(journalEntriesTable)
    .values({ sessionId, content, mood: mood || "neutral", date: dateStr })
    .returning();

  res.json({
    id: entry.id,
    sessionId: entry.sessionId,
    content: entry.content,
    mood: entry.mood,
    date: entry.date,
    createdAt: entry.createdAt ? entry.createdAt.toISOString() : null,
  });
});

router.delete("/journal/:id", async (req, res) => {
  const { sessionId } = req.body as { sessionId: string };
  const id = parseInt(req.params.id);
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  await db.query.journalEntriesTable.findFirst({
    where: and(eq(journalEntriesTable.id, id), eq(journalEntriesTable.sessionId, sessionId)),
  });

  await db
    .delete(journalEntriesTable)
    .where(and(eq(journalEntriesTable.id, id), eq(journalEntriesTable.sessionId, sessionId)));

  res.json({ success: true });
});

router.post("/stats/event", async (req, res) => {
  const { eventType } = req.body as { eventType: string };
  const validEvents = ["tawbah", "dhikr", "covenant", "dua", "quran"];
  if (!eventType || !validEvents.includes(eventType)) {
    return res.status(400).json({ error: "invalid eventType" });
  }
  await db.insert(globalStatsTable).values({
    eventType,
    date: todayStr(),
  });
  res.json({ success: true });
});

router.get("/stats/live", async (_req, res) => {
  const today = todayStr();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  const [todayRows, totalRows, weekRows] = await Promise.all([
    db.select({ eventType: globalStatsTable.eventType, cnt: count() })
      .from(globalStatsTable)
      .where(eq(globalStatsTable.date, today))
      .groupBy(globalStatsTable.eventType),
    db.select({ cnt: count() }).from(globalStatsTable),
    db.select({ cnt: count() }).from(globalStatsTable)
      .where(gte(globalStatsTable.date, weekAgo)),
  ]);

  const todayMap: Record<string, number> = {};
  for (const r of todayRows) todayMap[r.eventType] = Number(r.cnt);

  res.json({
    today: {
      tawbah: (todayMap["tawbah"] ?? 0) + (todayMap["covenant"] ?? 0),
      dhikr: todayMap["dhikr"] ?? 0,
      dua: todayMap["dua"] ?? 0,
      quran: todayMap["quran"] ?? 0,
    },
    total: Number(totalRows[0]?.cnt ?? 0),
    thisWeek: Number(weekRows[0]?.cnt ?? 0),
  });
});

// ── Country Map Endpoints ────────────────────────────────────────────

router.post("/stats/pin", async (req, res) => {
  const { countryCode } = req.body as { countryCode: string };
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) {
    res.status(400).json({ error: "كود دولة غير صحيح" });
    return;
  }
  await db.insert(globalStatsTable).values({ eventType: "tawbah", date: todayStr(), countryCode });
  res.json({ ok: true });
});

router.get("/stats/countries", async (_req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const rows = await db
    .select({ countryCode: globalStatsTable.countryCode, cnt: count() })
    .from(globalStatsTable)
    .where(and(gte(globalStatsTable.date, weekAgo), sql`${globalStatsTable.countryCode} IS NOT NULL`))
    .groupBy(globalStatsTable.countryCode)
    .orderBy(sql`count(*) DESC`)
    .limit(20);
  res.json(rows.map(r => ({ countryCode: r.countryCode, count: Number(r.cnt) })));
});

// ── Challenge Endpoints ──────────────────────────────────────────────

function makeSlug(len = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

router.post("/challenges", async (req, res) => {
  const { duration, pledge } = req.body as { duration: number; pledge?: string };
  if (!duration || ![7, 21, 40, 90].includes(Number(duration))) {
    res.status(400).json({ error: "مدة غير صحيحة" });
    return;
  }
  let slug = makeSlug();
  for (let i = 0; i < 5; i++) {
    const existing = await db.select({ id: challengesTable.id }).from(challengesTable).where(eq(challengesTable.slug, slug));
    if (existing.length === 0) break;
    slug = makeSlug();
  }
  const [row] = await db.insert(challengesTable).values({
    slug,
    duration: Number(duration),
    pledge: pledge?.trim() || null,
    startDate: todayStr(),
  }).returning();
  await db.insert(globalStatsTable).values({ eventType: "tawbah", date: todayStr() });
  res.json({ slug: row.slug });
});

router.get("/challenges/:slug", async (req, res) => {
  const { slug } = req.params;
  const [row] = await db.select().from(challengesTable).where(eq(challengesTable.slug, slug));
  if (!row) { res.status(404).json({ error: "التحدي غير موجود" }); return; }
  const start = new Date(row.startDate);
  const daysPassed = Math.floor((Date.now() - start.getTime()) / 86400000);
  res.json({
    slug: row.slug,
    duration: row.duration,
    pledge: row.pledge,
    startDate: row.startDate,
    daysPassed: Math.min(daysPassed, row.duration),
    encouragements: row.encouragements,
  });
});

router.post("/challenges/:slug/encourage", async (req, res) => {
  const { slug } = req.params;
  const [row] = await db.select({ id: challengesTable.id }).from(challengesTable).where(eq(challengesTable.slug, slug));
  if (!row) { res.status(404).json({ error: "التحدي غير موجود" }); return; }
  await db.update(challengesTable)
    .set({ encouragements: sql`${challengesTable.encouragements} + 1` })
    .where(eq(challengesTable.id, row.id));
  await db.insert(globalStatsTable).values({ eventType: "dua", date: todayStr() });
  res.json({ ok: true });
});

router.post("/secret-dua", async (req, res) => {
  const { sessionId, content } = req.body as { sessionId: string; content: string };
  if (!sessionId || !content?.trim()) {
    res.status(400).json({ error: "sessionId و content مطلوبان" });
    return;
  }

  const recentSessions = await db
    .select({ sessionId: userProgressTable.sessionId })
    .from(userProgressTable)
    .where(ne(userProgressTable.sessionId, sessionId))
    .orderBy(sql`RANDOM()`)
    .limit(10);

  const alreadyReceiving = await db
    .select({ toSessionId: secretDuasTable.toSessionId })
    .from(secretDuasTable)
    .where(and(
      gte(secretDuasTable.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      ne(secretDuasTable.fromSessionId, sessionId)
    ));

  const alreadyReceivingSet = new Set(alreadyReceiving.map(r => r.toSessionId));

  const candidate = recentSessions.find(s => !alreadyReceivingSet.has(s.sessionId));
  const toSessionId = candidate?.sessionId ?? null;

  await db.insert(secretDuasTable).values({
    fromSessionId: sessionId,
    toSessionId,
    content: content.trim(),
  });

  await db.insert(globalStatsTable).values({ eventType: "dua", date: todayStr() });
  res.json({ ok: true, matched: !!toSessionId });
});

router.get("/secret-dua/received", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) { res.status(400).json({ error: "sessionId مطلوب" }); return; }

  const [dua] = await db
    .select({ id: secretDuasTable.id, content: secretDuasTable.content, createdAt: secretDuasTable.createdAt })
    .from(secretDuasTable)
    .where(and(
      eq(secretDuasTable.toSessionId, sessionId),
      eq(secretDuasTable.isRead, false)
    ))
    .orderBy(desc(secretDuasTable.createdAt))
    .limit(1);

  if (!dua) { res.json({ dua: null }); return; }

  await db.update(secretDuasTable).set({ isRead: true }).where(eq(secretDuasTable.id, dua.id));
  res.json({ dua: { content: dua.content, createdAt: dua.createdAt } });
});

router.get("/secret-dua/stats", async (_req, res) => {
  const [result] = await db.select({ total: count() }).from(secretDuasTable);
  res.json({ total: result?.total ?? 0 });
});

// ══════════════════════════════════════════
// COMMUNITY DUAS — "قل آمين"
// ══════════════════════════════════════════

router.post("/community-duas", async (req, res) => {
  const { sessionId, content } = req.body as { sessionId: string; content: string };
  if (!sessionId || !content?.trim()) {
    res.status(400).json({ error: "sessionId و content مطلوبان" });
    return;
  }
  if (content.trim().length > 300) {
    res.status(400).json({ error: "الدعاء يجب ألا يتجاوز ٣٠٠ حرف" });
    return;
  }
  const [inserted] = await db
    .insert(communityDuasTable)
    .values({ sessionId, content: content.trim() })
    .returning();
  res.json({ dua: inserted });
});

router.get("/community-duas", async (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? "20"), 50);
  const rows = await db
    .select({
      id: communityDuasTable.id,
      content: communityDuasTable.content,
      amenCount: communityDuasTable.amenCount,
      createdAt: communityDuasTable.createdAt,
    })
    .from(communityDuasTable)
    .orderBy(desc(communityDuasTable.createdAt))
    .limit(limit);
  res.json({ duas: rows });
});

router.post("/community-duas/:id/amen", async (req, res) => {
  const id = parseInt(req.params.id ?? "0");
  if (!id) { res.status(400).json({ error: "id غير صحيح" }); return; }
  const [updated] = await db
    .update(communityDuasTable)
    .set({ amenCount: sql`${communityDuasTable.amenCount} + 1` })
    .where(eq(communityDuasTable.id, id))
    .returning({ amenCount: communityDuasTable.amenCount });
  if (!updated) { res.status(404).json({ error: "الدعاء غير موجود" }); return; }
  res.json({ amenCount: updated.amenCount });
});

export default router;
