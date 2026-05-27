import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import agentsRouter from "./agents.js";
import goalsRouter from "./goals.js";
import meetingsRouter from "./meetings.js";
import tasksRouter from "./tasks.js";
import metricsRouter from "./metrics.js";
import simulationsRouter from "./simulations.js";
import reportsRouter from "./reports.js";
import githubRouter from "./github.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/agents", agentsRouter);
router.use("/goals", goalsRouter);
router.use("/meetings", meetingsRouter);
router.use("/tasks", tasksRouter);
router.use("/metrics", metricsRouter);
router.use("/simulations", simulationsRouter);
router.use("/reports", reportsRouter);
router.use("/github", githubRouter);
router.use("/dashboard", dashboardRouter);

export default router;
