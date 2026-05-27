import { pgTable, serial, text, real, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  personality: text("personality").notNull(),
  status: text("status").notNull().default("idle"),
  currentTask: text("current_task"),
  productivityScore: real("productivity_score").notNull().default(75),
  avatarColor: text("avatar_color").notNull(),
  model: text("model").notNull().default("llama-3.3-70b-versatile"),
  lastActive: timestamp("last_active"),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
