# Project Sentinel — The Autonomous Incident Resolution Engine

A DevOps dashboard that connects to a mock production environment, detects failures, and autonomously fixes them using Claude subagents.

---

## Quick Start

```bash
# Install dependencies
npm install
cd ClaudeSubAgentIntegration/app && npm install && cd ../..

# Initialize database
npm run init-db

# Start dashboard
npm run app
# Dashboard: http://localhost:3000

# Inject a bug (in another terminal)
npm run chaos
```

---

## Architecture

| Component | Description |
|-----------|-------------|
| `scripts/chaos-monkey.ts` | Randomly injects 5 bug types into services |
| `services/` | 4 Node.js microservices (auth, analytics, notification, payment) |
| `data/incidents.db` | SQLite database for persistent incident tracking |
| `CLAUDE.md` | Claude's resolution protocol with strict TypeScript rules |
| `ClaudeSubAgentIntegration/app/` | Next.js dark-mode dashboard |

---

## Bug Types

| Type | Example |
|------|---------|
| `SYNTAX_ERROR` | Missing semicolon, bad bracket |
| `TYPE_MISMATCH` | `string` where `number` expected |
| `LOGIC_ERROR` | Inverted boolean, wrong operator |
| `ASYNC_ERROR` | Missing `await`, unhandled rejection |
| `NULL_DEREF` | Accessing property on null |

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run chaos` | Inject a random bug |
| `npm run init-db` | Initialize SQLite database |
| `npm run app` | Start dashboard at localhost:3000 |
| `npm run test-services` | Start all 4 microservices |
| `npm test` | Run regression tests |
| `npm run subagent -- <service>` | Multi-agent demo |

---

## The Workflow

1. **Inject bug:** `npm run chaos`
2. **Dashboard shows:** 1 Active incident
3. **Tell Claude:** "fix it" or use Plan Mode
4. **Verify:** Dashboard shows 0 Active, +1 Resolved
5. **Run tests:** `npm test` — 9 tests passing

---

## Phase-by-Phase Guide

### Phase 1: Setup
- Initialize repo, run chaos script, set up CLAUDE.md with TypeScript rules

### Phase 2: Infrastructure
- Build Next.js dashboard, connect SQLite MCP, practice piping commands

### Phase 3: Autonomous Fixing
- Run Chaos script → Use Plan Mode → Spawn subagent → Verify with tests

### Phase 4: Final Review
- Run `/compact` → Generate Post-Mortem report → Deploy to Vercel

---

## CLAUDE.md

Contains:
- Strict TypeScript rules (no `any`, strict mode)
- Naming conventions (PascalCase, SCREAMING_SNAKE_CASE)
- Resolution Protocol (check history → spawn subagent → verify → update SQLite)