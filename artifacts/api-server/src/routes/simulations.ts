import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { simulationsTable, goalsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "../lib/websocket.js";
import { groq } from "../lib/groq.js";
import { CreateSimulationBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const sims = await db.select().from(simulationsTable).orderBy(simulationsTable.createdAt);
    res.json(sims);
  } catch (err) {
    req.log.error({ err }, "Failed to list simulations");
    res.status(500).json({ error: "Failed to list simulations" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateSimulationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [simulation] = await db
      .insert(simulationsTable)
      .values({ ...parsed.data, status: "running" })
      .returning();

    broadcast("simulation_started", simulation);
    runSimulation(simulation.id, parsed.data.goalId, parsed.data.timeframe).catch(() => {});
    res.status(201).json(simulation);
  } catch (err) {
    req.log.error({ err }, "Failed to create simulation");
    res.status(500).json({ error: "Failed to create simulation" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [sim] = await db.select().from(simulationsTable).where(eq(simulationsTable.id, id));
    if (!sim) { res.status(404).json({ error: "Not found" }); return; }
    res.json(sim);
  } catch (err) {
    req.log.error({ err }, "Failed to get simulation");
    res.status(500).json({ error: "Failed to get simulation" });
  }
});

async function runSimulation(simId: number, goalId: number, timeframe: string): Promise<void> {
  try {
    const [goal] = await db.select().from(goalsTable).where(eq(goalsTable.id, goalId));
    const goalContext = goal ? `"${goal.title}": ${goal.description}` : "Unknown goal";

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a business simulation AI. Generate realistic predictions for a startup's trajectory over ${timeframe}.`,
        },
        {
          role: "user",
          content: `Simulate the next ${timeframe} for this business goal: ${goalContext}.
          
Provide a JSON response with this structure:
{
  "summary": "2-3 sentence executive summary",
  "predictions": {
    "revenue": {"value": number, "unit": "USD", "trend": "up|down|stable", "confidence": 0.0-1.0},
    "users": {"value": number, "unit": "users", "trend": "up|down|stable", "confidence": 0.0-1.0},
    "marketShare": {"value": number, "unit": "%", "trend": "up|down|stable", "confidence": 0.0-1.0},
    "burnRate": {"value": number, "unit": "USD/month", "trend": "up|down|stable", "confidence": 0.0-1.0},
    "risks": ["risk1", "risk2", "risk3"],
    "opportunities": ["opp1", "opp2", "opp3"],
    "milestones": [{"month": 1, "event": "description"}, ...]
  }
}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: raw, predictions: {} };

    await db
      .update(simulationsTable)
      .set({
        status: "completed",
        predictions: JSON.stringify(data.predictions),
        summary: data.summary,
      })
      .where(eq(simulationsTable.id, simId));

    broadcast("simulation_completed", { simId });
  } catch {
    await db.update(simulationsTable).set({ status: "failed" }).where(eq(simulationsTable.id, simId));
  }
}

export default router;
