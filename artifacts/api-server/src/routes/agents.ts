import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { agentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const agents = await db.select().from(agentsTable).orderBy(agentsTable.id);
    res.json(agents);
  } catch (err) {
    req.log.error({ err }, "Failed to list agents");
    res.status(500).json({ error: "Failed to list agents" });
  }
});

router.get("/network", async (req: Request, res: Response): Promise<void> => {
  try {
    const agents = await db.select().from(agentsTable).orderBy(agentsTable.id);
    const nodes = agents.map((a) => ({
      id: `agent-${a.id}`,
      agentId: a.id,
      label: a.name,
      status: a.status,
      communicationCount: Math.floor(Math.random() * 50) + 10,
    }));
    const edges: Array<{ source: string; target: string; weight: number; active: boolean }> = [];
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        if (Math.random() > 0.3) {
          edges.push({
            source: `agent-${agents[i].id}`,
            target: `agent-${agents[j].id}`,
            weight: Math.random(),
            active: Math.random() > 0.5,
          });
        }
      }
    }
    res.json({ nodes, edges });
  } catch (err) {
    req.log.error({ err }, "Failed to get agent network");
    res.status(500).json({ error: "Failed to get agent network" });
  }
});

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
    if (!agent) { res.status(404).json({}); return; }
    res.json(agent);
  } catch (err) {
    req.log.error({ err }, "Failed to get agent");
    res.status(500).json({ error: "Failed to get agent" });
  }
});

export default router;
