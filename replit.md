# HiveMind Nexus

The World's First Autonomous AI Workforce — a futuristic SaaS platform where 8 AI C-suite agents (CEO, CTO, Marketing, Finance, Sales, HR, Support, Design) collaborate in real time using Groq's Llama models to run a business autonomously.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/hivemind run dev` — run the frontend (port 22203)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `GROQ_API_KEY`, `GITHUB_PAT`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Framer Motion, Recharts, Tailwind CSS v4, Wouter, TanStack Query
- API: Express 5, WebSocket (`ws`)
- DB: PostgreSQL + Drizzle ORM
- AI: Groq API — `llama-3.3-70b-versatile` (CEO/CTO) + `llama3-70b-8192` (others)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — all Drizzle table definitions (agents, goals, messages, meetings, tasks, metrics, simulations, reports, github)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for all endpoints)
- `lib/api-client-react/src/generated/` — generated TanStack Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers per domain
- `artifacts/api-server/src/lib/groq.ts` — Groq AI engine with per-agent personalities
- `artifacts/api-server/src/lib/websocket.ts` — WebSocket broadcast helper
- `artifacts/hivemind/src/` — React frontend (pages, components, layout)

## Architecture decisions

- Contract-first: OpenAPI spec defines the API, hooks and Zod schemas are generated from it.
- Agents run asynchronously after HTTP responses return — prevents timeouts on Groq calls.
- WebSocket broadcasts real-time events (new_message, goal_completed, meeting_message, etc.) to all clients.
- All 8 agents seeded as DB rows with distinct colors, models, and personalities.
- GitHub integration pushes a SYNC.md commit to `sahichilakamari/hivemind-nexus` via PAT.

## Product

- **Landing Page** — cinematic hero with "AUTONOMOUS AI WORKFORCE" reveal
- **Command Center** — live dashboard with agent counts, system health, telemetry feed
- **Headquarters** — C-suite agent cards with status, productivity bars, and personalities
- **Business Goals** — create goals, watch 7 agents debate and plan in real time
- **Board Meetings** — run AI board meetings with multi-round agent discussion
- **Task Force** — Kanban task board managed by AI agents
- **Metrics** — live business KPIs with Recharts visualization
- **Simulations** — AI-powered business trajectory predictions
- **Reports** — generated intelligence documents archive
- **Network Topology** — animated Canvas graph of agent communication
- **GitHub Sync** — push AI-generated commits to the live GitHub repo

## User preferences

- JARVIS/Iron Man-inspired UI: glassmorphism, dark theme, electric cyan + neon purple palette
- Rajdhani + Space Mono fonts for HUD aesthetic
- GitHub owner: `sahichilakamari`, repo: `hivemind-nexus`
- No auth for hackathon demo
- Groq models only (no OpenAI)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing openapi.yaml
- Always run `pnpm --filter @workspace/db run push` after changing schema files
- Google Fonts @import must be FIRST line in index.css (before @import "tailwindcss")
- API routes use `.js` extension for local imports in ESM (e.g., `import from './lib/websocket.js'`)
- Agent collaboration runs async — messages appear via WebSocket, not in the initial HTTP response

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
