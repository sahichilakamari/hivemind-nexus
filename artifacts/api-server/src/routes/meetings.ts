import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { meetingsTable, meetingMessagesTable, agentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "../lib/websocket.js";
import { getAgentResponse } from "../lib/groq.js";
import { CreateMeetingBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const meetings = await db.select().from(meetingsTable).orderBy(meetingsTable.createdAt);
    res.json(meetings);
  } catch (err) {
    req.log.error({ err }, "Failed to list meetings");
    res.status(500).json({ error: "Failed to list meetings" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateMeetingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [meeting] = await db
      .insert(meetingsTable)
      .values({ ...parsed.data, status: "active" })
      .returning();

    broadcast("meeting_started", meeting);
    runBoardMeeting(meeting.id, meeting.title, meeting.agenda || "").catch(() => {});
    res.status(201).json(meeting);
  } catch (err) {
    req.log.error({ err }, "Failed to create meeting");
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [meeting] = await db.select().from(meetingsTable).where(eq(meetingsTable.id, id));
    if (!meeting) { res.status(404).json({}); return; }
    res.json(meeting);
  } catch (err) {
    req.log.error({ err }, "Failed to get meeting");
    res.status(500).json({ error: "Failed to get meeting" });
  }
});

router.get("/:id/messages", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const msgs = await db
      .select()
      .from(meetingMessagesTable)
      .where(eq(meetingMessagesTable.meetingId, id))
      .orderBy(meetingMessagesTable.createdAt);
    res.json(msgs.map((m) => ({ ...m, isDecision: m.isDecision === "true" })));
  } catch (err) {
    req.log.error({ err }, "Failed to list meeting messages");
    res.status(500).json({ error: "Failed to list meeting messages" });
  }
});

async function runBoardMeeting(meetingId: number, title: string, agenda: string): Promise<void> {
  const context = `Board Meeting: "${title}". Agenda: "${agenda || "General business strategy discussion"}"`;
  const agents = await db.select().from(agentsTable).orderBy(agentsTable.id);
  const boardAgents = agents.slice(0, 6);
  const history: Array<{ role: string; content: string }> = [];
  const rounds = 2;

  for (let round = 0; round < rounds; round++) {
    for (const agent of boardAgents) {
      try {
        const isFinalRound = round === rounds - 1;
        const isDecisionAgent = agent.role === "CEO" && isFinalRound;

        const response = await getAgentResponse(
          agent.name,
          agent.role,
          context,
          history,
          isDecisionAgent
            ? "As CEO, provide the final decision and action items for this board meeting."
            : undefined
        );

        const [msg] = await db
          .insert(meetingMessagesTable)
          .values({
            meetingId,
            agentId: agent.id,
            agentName: agent.name,
            agentRole: agent.role,
            content: response.content,
            confidence: response.confidence,
            isDecision: isDecisionAgent ? "true" : "false",
          })
          .returning();

        broadcast("meeting_message", { ...msg, isDecision: msg.isDecision === "true" });
        history.push({ role: "assistant", content: `${agent.name}: ${response.content}` });

        await db
          .update(agentsTable)
          .set({ status: "meeting", currentTask: `Board Meeting: ${title}`, lastActive: new Date() })
          .where(eq(agentsTable.id, agent.id));

        await new Promise((r) => setTimeout(r, 1000));
      } catch {
        // continue
      }
    }
  }

  await db
    .update(meetingsTable)
    .set({ status: "completed", endedAt: new Date() })
    .where(eq(meetingsTable.id, meetingId));

  await db.update(agentsTable).set({ status: "idle", currentTask: null });
  broadcast("meeting_completed", { meetingId });
}

export default router;
