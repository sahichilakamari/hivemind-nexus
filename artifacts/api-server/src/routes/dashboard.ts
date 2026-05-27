import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  agentsTable,
  goalsTable,
  tasksTable,
  messagesTable,
  meetingsTable,
  metricsTable,
} from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req: Request, res: Response): Promise<void> => {
  try {
    const [goals] = await db.select({ count: count() }).from(goalsTable);
    const [activeAgents] = await db
      .select({ count: count() })
      .from(agentsTable)
      .where(sql`${agentsTable.status} != 'offline'`);
    const [completedTasks] = await db
      .select({ count: count() })
      .from(tasksTable)
      .where(eq(tasksTable.status, "completed"));
    const [messages] = await db.select({ count: count() }).from(messagesTable);
    const [runningMeetings] = await db
      .select({ count: count() })
      .from(meetingsTable)
      .where(eq(meetingsTable.status, "active"));
    const recentMetrics = await db
      .select()
      .from(metricsTable)
      .orderBy(metricsTable.createdAt)
      .limit(6);

    res.json({
      totalGoals: goals?.count ?? 0,
      activeAgents: activeAgents?.count ?? 0,
      completedTasks: completedTasks?.count ?? 0,
      totalMessages: messages?.count ?? 0,
      runningMeetings: runningMeetings?.count ?? 0,
      autonomousMode: false,
      companyHealth: 78.5,
      recentMetrics,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Failed to get summary" });
  }
});

router.get("/activity", async (req: Request, res: Response): Promise<void> => {
  try {
    const recentMessages = await db
      .select()
      .from(messagesTable)
      .orderBy(sql`${messagesTable.createdAt} DESC`)
      .limit(10);

    const recentTasks = await db
      .select()
      .from(tasksTable)
      .orderBy(sql`${tasksTable.createdAt} DESC`)
      .limit(5);

    const recentGoals = await db
      .select()
      .from(goalsTable)
      .orderBy(sql`${goalsTable.createdAt} DESC`)
      .limit(5);

    const activity = [
      ...recentMessages.map((m) => ({
        id: `msg-${m.id}`,
        type: "message" as const,
        description: m.content.substring(0, 80) + (m.content.length > 80 ? "..." : ""),
        agentName: m.agentName,
        agentRole: m.agentRole,
        createdAt: m.createdAt.toISOString(),
      })),
      ...recentTasks.map((t) => ({
        id: `task-${t.id}`,
        type: "task" as const,
        description: `Task "${t.title}" is ${t.status}`,
        agentName: t.assignedAgentName || "System",
        agentRole: "Task Manager",
        createdAt: t.createdAt.toISOString(),
      })),
      ...recentGoals.map((g) => ({
        id: `goal-${g.id}`,
        type: "goal" as const,
        description: `New goal: "${g.title}"`,
        agentName: "CEO Agent",
        agentRole: "CEO",
        createdAt: g.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    res.json(activity);
  } catch (err) {
    req.log.error({ err }, "Failed to get activity");
    res.status(500).json({ error: "Failed to get activity" });
  }
});

export default router;
