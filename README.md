# HiveMind Nexus

> **The World's First Autonomous AI Workforce** — FlowZint AI Hackathon 2026

A futuristic full-stack SaaS platform where 8 AI C-suite agents collaborate in real time using Groq's Llama models to run a business autonomously. Iron Man / JARVIS-inspired UI with glassmorphism dark theme.

![HiveMind Nexus](https://img.shields.io/badge/status-live-00d4ff?style=for-the-badge&logo=data:image/svg+xml;base64,) [![Groq](https://img.shields.io/badge/Powered_by-Groq-7c3aed?style=for-the-badge)](https://groq.com)

---

## The AI Executive Team

| Agent | Role | Model | Personality |
|-------|------|-------|-------------|
| CEO Agent | Chief Executive | llama-3.3-70b-versatile | Strategic, visionary, resolves conflicts |
| CTO Agent | Chief Technology | llama-3.3-70b-versatile | Technical, precise, forward-thinking |
| Finance Agent | Chief Finance | llama-3.3-70b-versatile | Skeptical, risk-focused, analytical |
| Marketing Agent | Marketing Director | llama3-70b-8192 | Creative, persuasive, brand-driven |
| Sales Agent | Sales Director | llama3-70b-8192 | Ambitious, results-driven, customer-focused |
| HR Agent | HR Director | llama3-70b-8192 | Empathetic, people-first, culture-builder |
| Support Agent | Support Lead | llama3-70b-8192 | Patient, detail-oriented, customer-focused |
| Design Agent | Design Director | llama3-70b-8192 | Visual, creative, brand-conscious |

---

## Features

- **Command Center** — Live telemetry dashboard, system health, agent status monitoring
- **Business Goals** — Create a goal and watch 7 AI agents debate, plan and collaborate in real time
- **Board Meetings** — Run multi-round AI board meetings with CEO final decisions
- **Task Force** — Kanban task board managed by AI agents
- **Metrics Dashboard** — Live KPIs with Recharts visualization (revenue, users, growth, burn rate)
- **Simulations** — AI-powered business trajectory predictions (Groq generates JSON forecasts)
- **Reports** — Automatically generated intelligence reports pushed to GitHub
- **Neural Network** — Animated Canvas topology of all 8 agent communication links
- **GitHub Sync** — Every generated report/asset auto-commits to this repository via PAT

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite, Framer Motion, Recharts, Tailwind CSS v4 |
| Routing | Wouter |
| Data Fetching | TanStack Query (React Query) |
| Backend | Express 5, Node.js 24, TypeScript 5.9 |
| Real-time | WebSocket (`ws`) — bi-directional agent event streaming |
| Database | PostgreSQL + Drizzle ORM |
| AI | Groq API — `llama-3.3-70b-versatile` + `llama3-70b-8192` |
| Validation | Zod v4, drizzle-zod |
| API Contract | OpenAPI 3.0 → Orval codegen (hooks + Zod schemas) |
| Build | esbuild (ESM bundle), pnpm workspaces |
| Package Manager | pnpm (monorepo) |

---

## Project Structure

```
hivemind-nexus/
├── artifacts/
│   ├── api-server/          # Express 5 backend
│   │   └── src/
│   │       ├── routes/      # agents, goals, meetings, tasks, metrics,
│   │       │                #  simulations, reports, dashboard, github
│   │       └── lib/
│   │           ├── groq.ts      # Groq AI engine + agent personalities
│   │           └── websocket.ts # WS broadcast helper
│   └── hivemind/            # React + Vite frontend
│       └── src/
│           ├── pages/       # All 14 pages (dashboard, goals, meetings…)
│           ├── components/  # Shared UI components
│           └── index.css    # JARVIS theme (Rajdhani + Space Mono fonts)
├── lib/
│   ├── db/                  # PostgreSQL schema (Drizzle ORM)
│   │   └── src/schema/      # agents, goals, messages, meetings, tasks,
│   │                        #  metrics, simulations, reports, github
│   ├── api-spec/            # OpenAPI 3.0 contract (source of truth)
│   ├── api-client-react/    # Generated TanStack Query hooks
│   └── api-zod/             # Generated Zod validation schemas
└── scripts/                 # Utility scripts
```

---

## Setup & Running

### Prerequisites

- Node.js 24+
- pnpm 9+
- PostgreSQL (or use the Replit built-in DB)

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GROQ_API_KEY` | Your Groq API key — get one free at [console.groq.com](https://console.groq.com) |
| `GITHUB_PAT` | GitHub Personal Access Token (repo scope) for auto-push |
| `SESSION_SECRET` | Random secret string for session signing |

### Install & Run

```bash
# Install all workspace dependencies
pnpm install

# Push DB schema
pnpm --filter @workspace/db run push

# Seed the 8 AI agents (first time only)
# Run the seed SQL from scripts/seed.sql

# Start the API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start the frontend (port 22203)
pnpm --filter @workspace/hivemind run dev
```

### Regenerate API Types (after changing openapi.yaml)

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Typecheck Everything

```bash
pnpm run typecheck
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents` | List all 8 AI agents |
| GET | `/api/agents/network` | Agent communication topology graph |
| GET | `/api/agents/:id` | Get agent by ID |
| GET | `/api/goals` | List business goals |
| POST | `/api/goals` | Create goal (triggers agent collaboration) |
| GET | `/api/goals/:id/messages` | Get agent debate messages for a goal |
| POST | `/api/goals/:id/messages` | Send message to agents |
| GET | `/api/meetings` | List board meetings |
| POST | `/api/meetings` | Start board meeting (triggers AI discussion) |
| GET | `/api/meetings/:id/messages` | Get board meeting transcript |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task status |
| GET | `/api/metrics` | Business KPIs |
| GET | `/api/simulations` | List simulations |
| POST | `/api/simulations` | Run AI business simulation |
| GET | `/api/reports` | List generated intelligence reports |
| GET | `/api/github/logs` | GitHub push history |
| POST | `/api/github/push` | Trigger manual GitHub push |
| GET | `/api/dashboard/summary` | System overview stats |
| GET | `/api/dashboard/activity` | Recent agent activity feed |
| WS | `/ws` | WebSocket for real-time agent events |

### WebSocket Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | message object | New agent message in a goal thread |
| `goal_created` | goal object | New goal launched |
| `goal_completed` | `{ goalId }` | Agent collaboration finished |
| `meeting_message` | message object | Board meeting agent message |
| `meeting_started` | meeting object | Board meeting kicked off |
| `meeting_completed` | `{ meetingId }` | Board meeting concluded |
| `task_created` | task object | Task created |
| `task_updated` | task object | Task status updated |
| `simulation_completed` | `{ simId }` | Simulation results ready |
| `report_generated` | report object | New report auto-pushed to GitHub |
| `github_push_complete` | log object | GitHub commit succeeded |

---

## Architecture Decisions

1. **Contract-first API** — OpenAPI 3.0 spec is the source of truth; TanStack Query hooks and Zod schemas are generated from it via Orval.
2. **Async AI agents** — Groq calls run in the background after HTTP responses return to prevent timeouts.
3. **WebSocket streaming** — Real-time agent messages are broadcast via WebSocket so the frontend updates live without polling.
4. **Single Groq SDK instance** — One `groq` client is shared across all route handlers via `lib/groq.ts`.
5. **Auto-GitHub push** — Whenever a report or generated asset is created, the backend commits it to this repository automatically.

---

## License

MIT — Built for FlowZint AI Hackathon 2026
