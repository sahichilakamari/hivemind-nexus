import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const metricsTable = pgTable("business_metrics", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id"),
  metricType: text("metric_type").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull().default(""),
  label: text("label").notNull(),
  trend: text("trend"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const simulationsTable = pgTable("simulations", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  timeframe: text("timeframe").notNull(),
  status: text("status").notNull().default("pending"),
  predictions: text("predictions"),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  generatedBy: text("generated_by").notNull(),
  reportType: text("report_type").notNull().default("general"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMetricSchema = createInsertSchema(metricsTable).omit({ id: true, createdAt: true });
export const insertSimulationSchema = createInsertSchema(simulationsTable).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });
export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type BusinessMetric = typeof metricsTable.$inferSelect;
export type Simulation = typeof simulationsTable.$inferSelect;
export type Report = typeof reportsTable.$inferSelect;
