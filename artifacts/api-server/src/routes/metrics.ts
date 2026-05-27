import { Router } from "express";
import { db } from "@workspace/db";
import { metricsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { goalId } = req.query;
    const metrics = goalId
      ? await db
          .select()
          .from(metricsTable)
          .where(eq(metricsTable.goalId, parseInt(goalId as string)))
          .orderBy(metricsTable.createdAt)
      : await db.select().from(metricsTable).orderBy(metricsTable.createdAt);
    res.json(metrics);
  } catch (err) {
    req.log.error({ err }, "Failed to list metrics");
    res.status(500).json({ error: "Failed to list metrics" });
  }
});

export default router;
