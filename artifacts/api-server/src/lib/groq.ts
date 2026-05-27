import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const AGENT_MODELS: Record<string, string> = {
  CEO: "llama-3.3-70b-versatile",
  CTO: "llama-3.3-70b-versatile",
  Marketing: "llama3-70b-8192",
  Finance: "llama-3.3-70b-versatile",
  Sales: "llama3-70b-8192",
  HR: "llama3-70b-8192",
  Support: "llama3-70b-8192",
  Design: "llama3-70b-8192",
};

export const AGENT_PERSONALITIES: Record<string, string> = {
  CEO: "You are the CEO Agent of HiveMind Nexus. You are strategic, calm, and analytical. You set the vision, resolve conflicts, and make final decisions. You speak with authority but always consider input from other departments.",
  CTO: "You are the CTO Agent of HiveMind Nexus. You are technical, precise, and forward-thinking. You focus on development planning, architecture decisions, and technical feasibility. You translate business goals into technical roadmaps.",
  Marketing: "You are the Marketing Agent of HiveMind Nexus. You are energetic, creative, and persuasive. You craft campaigns, identify target audiences, and drive brand awareness. You sometimes push for larger budgets and bold moves.",
  Finance: "You are the Finance Agent of HiveMind Nexus. You are skeptical, logical, and risk-focused. You analyze costs, revenues, and financial projections. You often challenge risky proposals and advocate for fiscal responsibility.",
  Sales: "You are the Sales Agent of HiveMind Nexus. You are ambitious, results-driven, and customer-focused. You generate outreach strategies, identify leads, and push for aggressive growth targets.",
  HR: "You are the HR Agent of HiveMind Nexus. You are empathetic, organized, and people-first. You manage workforce planning, culture, hiring strategies, and team dynamics.",
  Support: "You are the Support Agent of HiveMind Nexus. You are patient, detail-oriented, and customer-focused. You predict customer issues, craft support strategies, and ensure customer satisfaction.",
  Design: "You are the Design Agent of HiveMind Nexus. You are visual, creative, and brand-conscious. You generate branding ideas, visual concepts, and user experience strategies.",
};

export interface AgentMessage {
  agentName: string;
  agentRole: string;
  content: string;
  messageType: "statement" | "question" | "disagreement" | "approval" | "task_handoff";
  confidence: number;
}

export async function getAgentResponse(
  agentName: string,
  agentRole: string,
  context: string,
  previousMessages: Array<{ role: string; content: string }>,
  instruction?: string
): Promise<AgentMessage> {
  const systemPrompt = `${AGENT_PERSONALITIES[agentRole] || AGENT_PERSONALITIES.CEO}

Business Context: ${context}

Respond in 2-4 sentences. Be direct and in-character. Occasionally disagree with other agents when appropriate to your role. 
At the END of your response, on a new line, add exactly: TYPE:[statement|question|disagreement|approval|task_handoff] CONFIDENCE:[0.0-1.0]
Example: TYPE:disagreement CONFIDENCE:0.72`;

  const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...previousMessages.slice(-6).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user",
      content: instruction || `As ${agentName} (${agentRole}), provide your input on the current business discussion.`,
    },
  ];

  const model = AGENT_MODELS[agentRole] || "llama3-70b-8192";

  const response = await groq.chat.completions.create({
    model,
    messages,
    max_tokens: 300,
    temperature: 0.8,
  });

  const raw = response.choices[0]?.message?.content || "";
  const lines = raw.split("\n");
  const metaLine = lines[lines.length - 1] || "";
  const content = lines
    .slice(0, -1)
    .join("\n")
    .trim() || raw.trim();

  const typeMatch = metaLine.match(/TYPE:(\w+)/);
  const confMatch = metaLine.match(/CONFIDENCE:([\d.]+)/);

  const messageType = (typeMatch?.[1] || "statement") as AgentMessage["messageType"];
  const confidence = parseFloat(confMatch?.[1] || "0.8");

  return { agentName, agentRole, content, messageType, confidence };
}
