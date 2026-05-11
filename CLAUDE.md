# Claude Agent Instructions — Project Sentinel

## Project Overview
**Project Sentinel** is an autonomous incident resolution engine for chaos engineering. Claude acts as an AI agent that:
1. Detects bugs injected by Chaos Monkey
2. Spawns subagents for parallel debugging/QA
3. Fixes the code autonomously
4. Updates the dashboard in real-time
5. Runs verification tests

---

## Architecture

### Components
- **`scripts/chaos-monkey.ts`** — Injects 5 types of bugs randomly
- **`services/`** — 4 microservices (auth, analytics, notification, payment)
- **`data/incidents.db`** — SQLite database for persistent incident tracking
- **`docs/incident-history.log`** — Legacy log file (still synced)
- **`ClaudeSubAgentIntegration/app/`** — Next.js dark-mode dashboard
- **`scripts/subagent-demo.ts`** — Multi-agent orchestration demo
- **`tests/services.test.ts`** — Regression tests (9 tests)

### Services (Ports)
| Service | Port | Status Endpoint |
|---------|------|----------------|
| auth-service | 4001 | /health |
| analytics-service | 4002 | /health |
| notification-service | 4003 | /health |
| payment-service | 4004 | /health |

---

## Naming Conventions (STRICT)
- All files: `kebab-case.ts`
- All interfaces: `PascalCase` prefixed with `I` → e.g. `IIncident`
- All services: suffix with `Service` → e.g. `AuthService`
- All constants: `SCREAMING_SNAKE_CASE`
- No `any` types. Ever.

---

## TypeScript Rules
- `strict: true` always on
- Prefer `unknown` over `any`
- All async functions must handle errors explicitly
- Use `zod` for runtime validation of external data

---

## Resolution Protocol (MANDATORY)

Every fix attempt must follow these steps in order:

### Step 1 — Check Incident History
```bash
# Check for prior attempts
cat docs/incident-history.log | grep "<INCIDENT_TYPE>"
# Or query SQLite
curl http://localhost:3000/api/incidents
```

### Step 2 — Use Plan Mode
For any complex fix, activate Plan Mode:
- Press Shift+Tab twice to enter plan mode
- Outline: Root cause, Repair strategy, Verification steps
- Get user approval before executing

### Step 3 — Spawn Subagents (Multi-Agent Orchestration)
When fixing bugs, demonstrate multi-agent workflow:

**Spawn Subagent Alpha (Debugger):**
```
"Spawn a /subagent to find and fix the bug in [service-name]. Analyze the injected code, remove it, and verify syntax."
```

**Main Agent Actions:**
- Update dashboard to "Investigating"
- Log the incident
- Coordinate with subagent

### Step 4 — Apply Fix + Update SQLite
After fixing the code:
```bash
# Mark as resolved in SQLite
npx ts-node scripts/sqlite-sync.ts <service> <type> "<fix description>"
```

### Step 5 — Run Verification Tests
```bash
npm test
```

### Step 6 — Verify Dashboard
- Check: `curl http://localhost:3000/api/incidents`
- Expected: 0 Active, +1 Resolved
- Popup should appear automatically

---

## Chaos Monkey Bug Types

| Code | Type | Example | Detection |
|------|------|---------|-----------|
| `SYNTAX_ERROR` | Parse-breaking syntax | Missing bracket, extra braces | Service won't start |
| `TYPE_MISMATCH` | Wrong type passed | `string` where `number` expected | Runtime type error |
| `LOGIC_ERROR` | Wrong algorithm result | Inverted boolean, wrong operator | Logic tests fail |
| `ASYNC_ERROR` | Promise misuse | Missing await, unhandled rejection | Async timeout |
| `NULL_DEREF` | Null/undefined access | `null.id` access | Runtime crash |

---

## Multi-Agent Orchestration

### Subagent Alpha — The Debugger
- Analyzes service code for errors
- Finds injected bug patterns
- Removes injected code
- Runs syntax verification

### Subagent Beta — The QA Engineer
- Creates regression tests
- Ensures bug doesn't return
- Verifies test coverage

### Main Agent — The Orchestrator
- Coordinates subagent work
- Updates dashboard UI
- Logs incidents to SQLite
- Runs final verification

### Demo Command
```bash
npm run subagent -- payment-service
```

---

## MCP Integrations

### SQLite MCP (Required)
- Database: `data/incidents.db`
- Tables: `incidents`, `service_status`
- Used for: Persistent state across sessions

### GitHub MCP (Optional)
- Used for: Git operations, diff viewing
- Configured in: `~/.claude/settings.json`

---

## Dashboard API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/incidents` | Get all incidents from SQLite |
| `/api/health` | Get service health status |
| `/api/notify` | Get latest resolved for popup |

---

## Available Commands

```bash
# Inject a random bug
npm run chaos

# Initialize SQLite database
npm run init-db

# Start the dashboard
npm run app

# Start all microservices
npm run test-services
# or on Windows:
start "" node services/auth-service/index.js
start "" node services/analytics-service/index.js
start "" node services/notification-service/index.js
start "" node services/payment-service/index.js

# Mark incident as resolved
npx ts-node scripts/sqlite-sync.ts <service> <type> "<description>"

# Run regression tests
npm test

# Run multi-agent demo
npm run subagent -- <service>
```

---

## Testing Workflow

1. **Inject bug:** `npm run chaos`
2. **Check dashboard:** Should show 1 Active
3. **Tell Claude:** "fix it" or use Plan Mode
4. **Verify:** Dashboard shows 0 Active, +1 Resolved
5. **Tests pass:** `npm test` - 9 tests

---

## Incident States

| Status | Meaning |
|--------|---------|
| `OPEN` | Bug injected, not yet fixed |
| `Investigating` | Claude is analyzing the bug |
| `Resolved` | Bug fixed, verified by tests |
| `ESCALATED` | Needs human intervention |

---

## Git Commit Protocol

When committing fixes:
1. Include service name and bug type
2. Reference incident ID
3. Note verification steps taken

Example commit message:
```
fix(auth-service): Remove injected SYNTAX_ERROR on line 41

- Removed extra braces {{{ from catch block
- Verified with npm test (9 tests passing)
- Updated SQLite to mark as RESOLVED
- Dashboard shows 0 Active incidents
```

---

## Post-Mortem Report Generation

After fixing incidents, generate a report:

```bash
# Get health data
curl http://localhost:3000/api/health

# Get incident data
curl http://localhost:3000/api/incidents
```

Include in report:
- System health score
- Services online/offline
- Incidents resolved by type
- Tests passed/failed

---

## Important Notes

- **Always use Plan Mode** for complex fixes
- **Spawn subagents** to demonstrate multi-agent orchestration
- **Never skip tests** - run `npm test` after every fix
- **Update SQLite** - don't rely solely on log file
- **Dashboard auto-refreshes** every 5 seconds
- **Popup notification** appears for 3.5 seconds on new resolution