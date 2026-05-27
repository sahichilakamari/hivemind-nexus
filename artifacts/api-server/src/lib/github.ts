import { db } from "@workspace/db";
import { githubLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { broadcast } from "./websocket.js";
import { logger } from "./logger.js";

const GITHUB_OWNER = "sahichilakamari";
const GITHUB_REPO = "hivemind-nexus";

async function getFileSha(path: string, token: string): Promise<string | undefined> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "HiveMind-Nexus",
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  if (!res.ok) return undefined;
  const data = (await res.json()) as { sha?: string };
  return data.sha;
}

async function putFile(
  path: string,
  content: string,
  message: string,
  token: string
): Promise<string> {
  const encoded = Buffer.from(content).toString("base64");
  const sha = await getFileSha(path, token);

  const body: Record<string, string> = { message, content: encoded };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "HiveMind-Nexus",
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = (await res.json()) as { commit?: { sha?: string } };
  return data.commit?.sha || "unknown";
}

/**
 * Push one or multiple files to GitHub and log the push.
 * Returns the log entry.
 */
export async function pushFilesToGitHub(
  files: Array<{ path: string; content: string }>,
  commitMessage: string
): Promise<void> {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    logger.warn("GITHUB_PAT not set — skipping auto-push");
    return;
  }

  const [logEntry] = await db
    .insert(githubLogsTable)
    .values({ commitMessage, status: "pending" })
    .returning();

  broadcast("github_push_started", logEntry);

  try {
    let lastSha = "unknown";
    for (const file of files) {
      lastSha = await putFile(file.path, file.content, commitMessage, token);
    }

    const [updated] = await db
      .update(githubLogsTable)
      .set({
        status: "success",
        commitHash: lastSha.substring(0, 7),
        filesChanged: files.length,
        repoUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`,
      })
      .where(eq(githubLogsTable.id, logEntry.id))
      .returning();

    broadcast("github_push_complete", updated);
    logger.info({ files: files.map((f) => f.path), sha: lastSha.substring(0, 7) }, "Auto-pushed to GitHub");
  } catch (err) {
    await db
      .update(githubLogsTable)
      .set({ status: "failed" })
      .where(eq(githubLogsTable.id, logEntry.id));

    broadcast("github_push_failed", { logId: logEntry.id, error: String(err) });
    logger.error({ err }, "GitHub auto-push failed");
  }
}
