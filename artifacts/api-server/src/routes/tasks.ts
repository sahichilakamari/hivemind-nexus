import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { broadcast } from "../lib/websocket.js";
import { CreateTaskBody, UpdateTaskBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { goalId, status } = req.query;
    const conditions = [];
    if (goalId) conditions.push(eq(tasksTable.goalId, parseInt(goalId as string)));
    if (status) conditions.push(eq(tasksTable.status, status as string));
    const tasks =
      conditions.length > 0
        ? await db
            .select()
            .from(tasksTable)
            .where(conditions.length === 1 ? conditions[0] : and(...conditions))
            .orderBy(tasksTable.createdAt)
        : await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
    res.json(tasks);
  } catch (err) {
    req.log.error({ err }, "Failed to list tasks");
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [task] = await db.insert(tasksTable).values(parsed.data).returning();
    broadcast("task_created", task);
    res.status(201).json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === "completed") updates.completedAt = new Date();

    const [task] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();
    if (!task) { res.status(404).json({ error: "Not found" }); return; }
    broadcast("task_updated", task);
    res.json(task);
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(500).json({ error: "Failed to update task" });
  }
});

export default router;
