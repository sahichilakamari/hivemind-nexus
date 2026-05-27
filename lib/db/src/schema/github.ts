import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const githubLogsTable = pgTable("github_logs", {
  id: serial("id").primaryKey(),
  commitHash: text("commit_hash"),
  commitMessage: text("commit_message").notNull(),
  status: text("status").notNull().default("pending"),
  filesChanged: integer("files_changed"),
  repoUrl: text("repo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const generatedAssetsTable = pgTable("generated_assets", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull(),
  assetType: text("asset_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  generatedBy: text("generated_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGithubLogSchema = createInsertSchema(githubLogsTable).omit({ id: true, createdAt: true });
export const insertGeneratedAssetSchema = createInsertSchema(generatedAssetsTable).omit({ id: true, createdAt: true });
export type InsertGithubLog = z.infer<typeof insertGithubLogSchema>;
export type InsertGeneratedAsset = z.infer<typeof insertGeneratedAssetSchema>;
export type GithubLog = typeof githubLogsTable.$inferSelect;
export type GeneratedAsset = typeof generatedAssetsTable.$inferSelect;
