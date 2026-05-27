import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { goalsTable, messagesTable, generatedAssetsTable, agentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "../lib/websocket.js";
import { getAgentResponse } from "../lib/groq.js";
import { CreateGoalBody, SendGoalMessageBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const goals = await db.select().from(goalsTable).orderBy(goalsTable.createdAt);
    res.json(goals);
  } catch (err) {
    req.log.error({ err }, "Failed to list goals");
    res.status(500).json({ error: "Failed to list goals" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [goal] = await db
      .insert(goalsTable)
      .values({ ...parsed.data, status: "active" })
      .returning();

    broadcast("goal_created", goal);
    triggerAgentCollaboration(goal.id, goal.title, goal.description).catch(() => {});
    res.status(201).json(goal);
  } catch (err) {
    req.log.error({ err }, "Failed to create goal");
    res.status(500).json({ error: "Failed to create goal" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, id));
    if (!goal) { res.status(404).json({}); return; }
    res.json(goal);
  } catch (err) {
    req.log.error({ err }, "Failed to get goal");
    res.status(500).json({ error: "Failed to get goal" });
  }
});

router.get("/:id/messages", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.goalId, id))
      .orderBy(messagesTable.createdAt);
    res.json(msgs);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/:id/messages", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = SendGoalMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, id));
    if (!goal) { res.status(404).json({}); return; }

    const [msg] = await db
      .insert(messagesTable)
      .values({
        goalId: id,
        agentName: "User",
        agentRole: "User",
        content: parsed.data.content,
        messageType: "user",
        confidence: 1.0,
      })
      .returning();

    broadcast("new_message", msg);
    triggerAgentReplies(id, goal.title, goal.description, parsed.data.content).catch(() => {});
    res.status(201).json(msg);
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.get("/:id/assets", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const assets = await db
      .select()
      .from(generatedAssetsTable)
      .where(eq(generatedAssetsTable.goalId, id))
      .orderBy(generatedAssetsTable.createdAt);
    res.json(assets);
  } catch (err) {
    req.log.error({ err }, "Failed to list assets");
    res.status(500).json({ error: "Failed to list assets" });
  }
});

async function triggerAgentCollaboration(goalId: number, title: string, description: string): Promise<void> {
  const context = `Business Goal: "${title}". Description: "${description}"`;
  const agentSequence = [
    { role: "CEO", name: "CEO Agent" },
    { role: "Finance", name: "Finance Agent" },
    { role: "Marketing", name: "Marketing Agent" },
    { role: "CTO", name: "CTO Agent" },
    { role: "HR", name: "HR Agent" },
    { role: "Sales", name: "Sales Agent" },
    { role: "CEO", name: "CEO Agent" },
  ];

  const history: Array<{ role: string; content: string }> = [];

  for (const agent of agentSequence) {
    try {
      const response = await getAgentResponse(agent.name, agent.role, context, history);
      const [msg] = await db
        .insert(messagesTable)
        .values({
          goalId,
          agentName: agent.name,
          agentRole: agent.role,
          content: response.content,
          messageType: response.messageType,
          confidence: response.confidence,
        })
        .returning();

      broadcast("new_message", msg);
      history.push({ role: "assistant", content: `${agent.name}: ${response.content}` });

      const [agentRow] = await db.select().from(agentsTable).where(eq(agentsTable.name, agent.name));
      if (agentRow) {
        await db
          .update(agentsTable)
          .set({ status: "working", currentTask: `Analyzing: ${title}`, lastActive: new Date() })
          .where(eq(agentsTable.id, agentRow.id));
      }

      await new Promise((r) => setTimeout(r, 1200));
    } catch {
      // continue if one agent fails
    }
  }

  await db.update(agentsTable).set({ status: "idle", currentTask: null });
  await db.update(goalsTable).set({ status: "completed" }).where(eq(goalsTable.id, goalId));
  broadcast("goal_completed", { goalId });
}

async function triggerAgentReplies(
  goalId: number,
  title: string,
  description: string,
  userMessage: string
): Promise<void> {
  const context = `Business Goal: "${title}". Description: "${description}"`;
  const existingMsgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.goalId, goalId))
    .orderBy(messagesTable.createdAt);

  const history = existingMsgs.slice(-8).map((m) => ({
    role: "assistant" as const,
    content: `${m.agentName}: ${m.content}`,
  }));

  const respondingAgents = [
    { role: "CEO", name: "CEO Agent" },
    { role: "Finance", name: "Finance Agent" },
    { role: "Marketing", name: "Marketing Agent" },
  ];

  for (const agent of respondingAgents) {
    try {
      const response = await getAgentResponse(
        agent.name,
        agent.role,
        context,
        history,
        `User said: "${userMessage}". Respond as ${agent.name}.`
      );

      const [msg] = await db
        .insert(messagesTable)
        .values({
          goalId,
          agentName: agent.name,
          agentRole: agent.role,
          content: response.content,
          messageType: response.messageType,
          confidence: response.confidence,
        })
        .returning();

      broadcast("new_message", msg);
      history.push({ role: "assistant", content: `${agent.name}: ${response.content}` });
      await new Promise((r) => setTimeout(r, 800));
    } catch {
      // continue
    }
  }
}

export default router;
