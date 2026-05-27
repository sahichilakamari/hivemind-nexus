import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { githubLogsTable } from "@workspace/db";
import { PushToGithubBody } from "@workspace/api-zod";
import { broadcast } from "../lib/websocket.js";
import { eq } from "drizzle-orm";

const router = Router();

const GITHUB_PAT = process.env.GITHUB_PAT!;
const GITHUB_OWNER = "sahichilakamari";
const GITHUB_REPO = "hivemind-nexus";

router.get("/logs", async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await db.select().from(githubLogsTable).orderBy(githubLogsTable.createdAt);
    res.json(logs);
  } catch (err) {
    req.log.error({ err }, "Failed to list github logs");
    res.status(500).json({ error: "Failed to list github logs" });
  }
});

router.post("/push", async (req: Request, res: Response): Promise<void> => {
  const parsed = PushToGithubBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  try {
    const [logEntry] = await db
      .insert(githubLogsTable)
      .values({ commitMessage: parsed.data.commitMessage, status: "pending" })
      .returning();

    broadcast("github_push_started", logEntry);
    pushToGitHub(logEntry.id, parsed.data.commitMessage).catch(() => {});
    res.json(logEntry);
  } catch (err) {
    req.log.error({ err }, "Failed to initiate push");
    res.status(500).json({ error: "Failed to initiate push" });
  }
});

async function pushToGitHub(logId: number, commitMessage: string): Promise<void> {
  try {
    const content = Buffer.from(
      `# HiveMind Nexus\n\nThe World's First Autonomous AI Workforce\n\nLast sync: ${new Date().toISOString()}\n\nCommit: ${commitMessage}\n`
    ).toString("base64");

    const readmeRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/SYNC.md`,
      {
        headers: {
          Authorization: `token ${GITHUB_PAT}`,
          "User-Agent": "HiveMind-Nexus",
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    const readmeData = (await readmeRes.json()) as { sha?: string };
    const fileSha = readmeData?.sha;

    const updateBody: Record<string, string> = { message: commitMessage, content };
    if (fileSha) updateBody.sha = fileSha;

    const updateRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/SYNC.md`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_PAT}`,
          "User-Agent": "HiveMind-Nexus",
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify(updateBody),
      }
    );

    const updateData = (await updateRes.json()) as { commit?: { sha?: string } };
    const commitSha = updateData?.commit?.sha || "unknown";

    const [updated] = await db
      .update(githubLogsTable)
      .set({
        status: "success",
        commitHash: commitSha.substring(0, 7),
        filesChanged: 1,
        repoUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`,
      })
      .where(eq(githubLogsTable.id, logId))
      .returning();

    broadcast("github_push_complete", updated);
  } catch (err) {
    await db
      .update(githubLogsTable)
      .set({ status: "failed" })
      .where(eq(githubLogsTable.id, logId));
    broadcast("github_push_failed", { logId, error: String(err) });
  }
}

export default router;
