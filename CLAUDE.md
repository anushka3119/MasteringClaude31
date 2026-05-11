# Claude Agent Instructions — ClaudeSubAgentIntegration

## Project Overview
This is a chaos engineering + AI incident resolution system. Claude acts as an autonomous sub-agent that detects, investigates, and resolves bugs introduced by the Chaos Monkey script. A Next.js dashboard visualizes live incident state.

## Architecture
- `scripts/chaos-monkey.ts` — Randomly injects 5 bug types into services
- `services/` — Target microservices (auth, analytics, notification, payment)
- `docs/incident-history.log` — Persistent log of all incidents and fix attempts
- `app/` — Next.js dashboard (dark-mode, live incident tracking)

## Naming Conventions (STRICT)
- All files: `kebab-case.ts`
- All interfaces: `PascalCase` prefixed with `I` → e.g. `IIncident`
- All services: suffix with `Service` → e.g. `AuthService`
- All constants: `SCREAMING_SNAKE_CASE`
- No `any` types. Ever.

## TypeScript Rules
- `strict: true` always on
- Prefer `unknown` over `any`
- All async functions must handle errors explicitly (no silent `.catch(() => {})`)
- Use `zod` for runtime validation of external data

---

## Resolution Protocol (MANDATORY — Read Before Every Fix)

> This protocol is **non-negotiable**. Every fix attempt must follow these steps in order.

### Step 1 — Check Incident History
Before writing a single line of fix code, read `/docs/incident-history.log`.

```bash
cat docs/incident-history.log | grep "<INCIDENT_TYPE>"
```

Search for the current incident type (e.g. `SYNTAX_ERROR`, `TYPE_MISMATCH`, `LOGIC_ERROR`).

### Step 2 — Evaluate Prior Fix Attempts
- If this **exact fix has been attempted before and failed**: activate **Thinking Mode** (see below)
- If this is a **fresh incident type** or prior fix succeeded elsewhere: proceed with standard fix

### Step 3 — Thinking Mode (Triggered by Repeated Failures)
When the same fix has failed before, do NOT apply it again. Instead:

1. State explicitly: `"[THINKING MODE ACTIVATED] — Prior fix failed. Analyzing alternatives."`
2. List at least 3 alternative approaches with trade-offs
3. Choose the approach least similar to the failed attempt
4. Document reasoning in the log before applying

### Step 4 — Apply Fix + Log Result
After applying any fix, append to `/docs/incident-history.log`:

```
[TIMESTAMP] INCIDENT: <type> | SERVICE: <name> | FIX: <brief description> | RESULT: SUCCESS|FAILED | THINKING_MODE: YES|NO
```

### Step 5 — Update Dashboard
After resolution, update the incident status via:
```bash
cat services/error.log | claude -p "Analyze this and update the dashboard status to 'Resolved'."
```

---

## Chaos Monkey Bug Types
The Chaos Monkey script injects these 5 bug categories. Know them:

| Code | Type | Example |
|------|------|---------|
| `SYNTAX_ERROR` | Parse-breaking syntax | Missing bracket, bad import |
| `TYPE_MISMATCH` | Wrong type passed | `string` where `number` expected |
| `LOGIC_ERROR` | Wrong algorithm result | Off-by-one, inverted boolean |
| `ASYNC_ERROR` | Promise misuse | Missing `await`, unhandled rejection |
| `NULL_DEREF` | Null/undefined access | Accessing `.id` on possibly-null |

---

## Sub-Agent Behavior Rules
- **Never apply a fix without reading incident history first**
- **Never mark an incident Resolved without running the test suite**
- **Never suppress TypeScript errors with `// @ts-ignore`**
- When uncertain between two fixes, log both and ask the orchestrator
- Dashboard status must always reflect ground truth — never optimistic updates

---

## MCP Integrations
- **SQLite MCP**: Used to persist incident state across agent sessions
- **GitHub MCP**: Used to diff files and detect Chaos Monkey injections
- Access both via Claude Code's MCP tool registry

---

## Commands Reference
```bash
# Run chaos monkey (injects 1 random bug)
npx ts-node scripts/chaos-monkey.ts

# Check service health
curl http://localhost:3000/api/health

# View incident log
cat docs/incident-history.log

# Pipe error log to Claude for analysis
cat services/error.log | claude -p "Analyze this and update the dashboard status to 'Investigating'."

# Run type checker
npx tsc --noEmit

# Run tests
npm test
```
