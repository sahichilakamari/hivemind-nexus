import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const simulationsTable = pgTable("simulations", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  timeframe: text("timeframe").notNull().default("6 months"),
  status: text("status").notNull().default("pending"),
  predictions: text("predictions"),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSimulationSchema = createInsertSchema(simulationsTable).omit({ id: true, createdAt: true });
export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Simulation = typeof simulationsTable.$inferSelect;
