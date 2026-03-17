import { pgTable, text, serial, boolean, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProgressTable = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  sinCategory: text("sin_category").notNull().default("other"),
  covenantSigned: boolean("covenant_signed").notNull().default(false),
  covenantDate: timestamp("covenant_date"),
  currentPhase: integer("current_phase").notNull().default(1),
  day40Progress: integer("day40_progress").notNull().default(0),
  firstDayTasksCompleted: boolean("first_day_tasks_completed").notNull().default(false),
  streakDays: integer("streak_days").notNull().default(0),
  lastActiveDate: date("last_active_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgressTable).omit({ id: true, createdAt: true });
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgressTable.$inferSelect;

export const habitsTable = pgTable("habits", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  habitKey: text("habit_key").notNull(),
  habitNameAr: text("habit_name_ar").notNull(),
  completed: boolean("completed").notNull().default(false),
  date: date("date").notNull(),
});

export const insertHabitSchema = createInsertSchema(habitsTable).omit({ id: true });
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habitsTable.$inferSelect;

export const dhikrCountTable = pgTable("dhikr_count", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  date: date("date").notNull(),
  istighfar: integer("istighfar").notNull().default(0),
  tasbih: integer("tasbih").notNull().default(0),
  sayyid: integer("sayyid").notNull().default(0),
});

export const insertDhikrCountSchema = createInsertSchema(dhikrCountTable).omit({ id: true });
export type InsertDhikrCount = z.infer<typeof insertDhikrCountSchema>;
export type DhikrCount = typeof dhikrCountTable.$inferSelect;

export const kaffarahStepsTable = pgTable("kaffarah_steps", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  stepKey: text("step_key").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKaffarahStepSchema = createInsertSchema(kaffarahStepsTable).omit({ id: true, createdAt: true });
export type InsertKaffarahStep = z.infer<typeof insertKaffarahStepSchema>;
export type KaffarahStep = typeof kaffarahStepsTable.$inferSelect;

export const journalEntriesTable = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  content: text("content").notNull(),
  mood: text("mood").notNull().default("neutral"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntriesTable).omit({ id: true, createdAt: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntriesTable.$inferSelect;

export const zakiyMemoryTable = pgTable("zakiy_memory", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  memoryJson: text("memory_json").notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ZakiyMemory = typeof zakiyMemoryTable.$inferSelect;
