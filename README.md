# 🐵 Chaos Engineering + Claude AI Incident Resolution System

A complete chaos engineering system where Claude acts as an autonomous agent that detects, investigates, and resolves bugs injected by the Chaos Monkey script. A Next.js dashboard visualizes live incident state in dark mode.

---

## 🎯 Project Overview

### Architecture
- **Chaos Monkey** (`scripts/chaos-monkey.ts`) — Randomly injects 5 types of bugs into microservices
- **Microservices** (`services/`) — Auth, Analytics, Notification, Payment services (Node.js + Express)
- **Incident Log** (`docs/incident-history.log`) — Persistent log of all incidents and fix attempts
- **Dashboard** (`app/`) — Next.js dark-mode UI for real-time incident tracking
- **API Routes** (`app/api/incidents/`) — Backend endpoints for incident management

### Bug Types Injected
| Code | Type | Example |
|------|------|---------|
| `SYNTAX_ERROR` | Parse-breaking syntax | Missing semicolon, bad bracket |
| `TYPE_MISMATCH` | Wrong type passed | `string` where `number` expected |
| `LOGIC_ERROR` | Wrong algorithm result | Inverted boolean, flipped operator |
| `ASYNC_ERROR` | Promise misuse | Missing `await`, unhandled rejection |
| `NULL_DEREF` | Null/undefined access | Accessing property on null |

---

## 📁 Project Structure

```
.
├── AGENTS.md                          # Multi-agent behavior specification
├── CLAUDE.md                          # Claude agent strict instructions
├── package.json                       # Root-level scripts
├── tsconfig.json                      # TypeScript configuration
│
├── scripts/
│   └── chaos-monkey.ts               # Bug injection orchestrator
│
├── services/
│   ├── auth-service/                 # Authentication microservice
│   │   ├── index.js
│   │   └── package.json
│   ├── analytics-service/            # Analytics tracking service
│   │   ├── index.js
│   │   └── package.json
│   ├── notification-service/         # Notification dispatcher
│   │   ├── index.js
│   │   └── package.json
│   └── payment-service/              # Payment processor
│       ├── index.js
│       └── package.json
│
├── docs/
│   └── incident-history.log          # Persistent incident log
│
└── ClaudeSubAgentIntegration/app/
    ├── app/
    │   ├── page.tsx                  # Main dashboard component
    │   ├── api/
    │   │   └── incidents/
    │   │       └── route.ts          # Incident API endpoints
    │   ├── globals.css
    │   └── layout.tsx
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    └── postcss.config.mjs
```

---

## 🚀 Quick Start

### Phase 1: Setup & Chaos (1-3 hours)

#### 1. Install Root Dependencies
```bash
cd "c:\d-disk shifted\Downloads\mc"
npm install
```
This installs TypeScript, ts-node, and other build tools needed for the chaos monkey script.

#### 2. Install Dashboard Dependencies
```bash
cd ClaudeSubAgentIntegration\app
npm install
cd ../..
```
This sets up the Next.js dashboard with React and Tailwind CSS.

#### 3. Run the Chaos Monkey
```bash
npm run chaos
```
This runs `npx ts-node scripts/chaos-monkey.ts`, which:
- Randomly selects a service (auth, analytics, notification, or payment)
- Randomly selects a bug type (SYNTAX_ERROR, TYPE_MISMATCH, LOGIC_ERROR, ASYNC_ERROR, NULL_DEREF)
- Injects the bug into the service's `index.js` file
- Logs the incident to `docs/incident-history.log`

**Example output:**
```
🐵 Chaos Monkey starting...
🎯 Target: payment-service
🐛 Bug Type: SYNTAX_ERROR

✅ Bug injected successfully!
   ID: incident-1778500646461-rnkn27e3e
   File: index.js
   Line: 46
   Original:   res.json({ transactions: userTransactions });
   Injected:   res.json({ transactions: userTransactions })

📝 Incident logged to C:\d-disk shifted\Downloads\mc\docs\incident-history.log
```

#### 4. Check Incident Log
```bash
Get-Content docs\incident-history.log
```

---

### Phase 2: The Infrastructure (4-8 hours)

#### 1. Start the Next.js Dashboard
```bash
cd "c:\d-disk shifted\Downloads\mc\ClaudeSubAgentIntegration\app"
npm run dev
```

Dashboard will be available at:
- **Local:** `http://localhost:3001` (or 3000 if available)
- **Network:** `http://192.168.29.91:3001`

Features:
- **Real-time incident display** — Lists all injected bugs
- **Health monitoring** — System health score (0–100) based on open incidents
- **Status filtering** — Filter by OPEN, Investigating, Resolved, ESCALATED
- **Dark mode UI** — Professional incident tracking interface
- **Auto-refresh** — Polls for new incidents every 5 seconds

#### 2. Start Microservices (Optional)
In separate terminals, start each service:
```bash
# Terminal 1: Auth Service (port 4001)
cd services\auth-service && node index.js

# Terminal 2: Analytics Service (port 4002)
cd services\analytics-service && node index.js

# Terminal 3: Notification Service (port 4003)
cd services\notification-service && node index.js

# Terminal 4: Payment Service (port 4004)
cd services\payment-service && node index.js
```

#### 3. Inject Multiple Bugs
```bash
npm run chaos
npm run chaos
npm run chaos
```

The dashboard will automatically detect and display the incidents as they're logged.

---

## 🔄 Workflow: Detecting & Resolving Incidents

### Step 1: Chaos Monkey Injects Bug
```bash
npm run chaos
```
Bug is injected into a random service and logged to `docs/incident-history.log`.

### Step 2: Dashboard Detects Incident
The dashboard's `/api/incidents` endpoint reads the log file and displays:
- Bug type and affected service
- File path and line number
- Timestamp of injection
- Current status (OPEN)

### Step 3: Claude Sub-Agent Resolves (Future)
According to CLAUDE.md, the sub-agent will:
1. Read `docs/incident-history.log` (MANDATORY)
2. Check if this bug type was seen before
3. If repeated failure → activate **Thinking Mode**
4. Apply fix and run `npx tsc --noEmit` + `npm test` to verify
5. Update log with result: `[TIMESTAMP] INCIDENT: <type> | SERVICE: <name> | FIX: <description> | RESULT: SUCCESS|FAILED | THINKING_MODE: YES|NO`
6. Dashboard polls and updates status to "Investigating" or "Resolved"

---

## 📝 Incident History Log Format

**Location:** `docs/incident-history.log`

**Example entry:**
```
[2026-05-11T11:57:26.463Z] INCIDENT: SYNTAX_ERROR | SERVICE: payment-service | FILE: index.js | LINE: 46 | RESULT: INJECTED
[2026-05-11T12:00:15.124Z] UPDATE: Incident incident-1778500646461-rnkn27e3e status changed to Investigating
[2026-05-11T12:05:32.891Z] INCIDENT: SYNTAX_ERROR | SERVICE: payment-service | FIX: Added missing semicolon | RESULT: SUCCESS | THINKING_MODE: NO
```

---

## 🧠 Piping: Analyze Error Log & Update Dashboard

### Command Pattern
```bash
cat services/error.log | claude -p "Analyze this and update the dashboard status to 'Investigating'."
```

### How It Works
1. **Read error log** — `cat services/error.log`
2. **Pipe to Claude** — Sends raw log content to Claude's context
3. **Claude analyzes** — Identifies the incident type, affected service, root cause
4. **Update dashboard** — Claude writes an update entry to `docs/incident-history.log`
5. **Dashboard refreshes** — Polls every 5 seconds and shows updated status

### Example
```bash
# Generate an error (by running a broken service)
node services/payment-service/index.js 2> services/error.log &

# Pipe the error to Claude for analysis
Get-Content services/error.log | claude -p "Analyze this error. What type of incident is it? Update the dashboard status to 'Investigating'."
```

---

## 🔧 Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run chaos` | Inject 1 random bug into a service |
| `npm run app` | Start Next.js dashboard on port 3001 |
| `npm run test-services` | Start all 4 microservices in parallel |
| `npm run all` | Run chaos monkey, then start dashboard |
| `Get-Content docs\incident-history.log` | View all incidents and fixes |
| `npx ts-node scripts/chaos-monkey.ts` | Run chaos monkey directly |

---

## ✅ Naming Conventions (Enforced)

From `CLAUDE.md` — ALL CODE MUST FOLLOW THESE:

- **Files:** `kebab-case.ts` ✓
- **Interfaces:** `PascalCase` with `I` prefix → `IIncident` ✓
- **Services:** Suffix with `Service` → `AuthService` ✓
- **Constants:** `SCREAMING_SNAKE_CASE` ✓
- **TypeScript:** `strict: true`, `no any`, prefer `unknown` ✓

---

## 🛡️ TypeScript & Code Quality

- **Strict mode:** Always enabled
- **No `any` types:** Ever. Use `unknown` instead
- **Error handling:** All async functions must handle errors explicitly
- **Validation:** Use `zod` for runtime validation
- **Build check:** `npx tsc --noEmit` before every fix attempt

---

## 📊 Dashboard Features

### Sidebar
- **Health Ring** — Visual indicator of system health (0–100)
- **Service Status** — Shows online/offline services
- **Incident Counts** — Open, Resolved, Escalated
- **Filter Buttons** — Filter incidents by status

### Incident List
- **Colored badges** — Each bug type has a unique color
- **Service name** — Which service was affected
- **Timestamp** — When the bug was injected
- **Thinking mode indicator** — 🧠 Shows if Claude activated Thinking Mode
- **Fix attempts** — Count of resolution attempts

### Detail Panel
- **Full incident info** — Bug type, service, file path
- **Resolution status** — Current status and fix attempts
- **Code comparison** — Original vs. injected code

---

## 🚨 Resolution Protocol (MANDATORY)

Every fix attempt **MUST** follow this protocol (from CLAUDE.md):

### Step 1: Check Incident History
```bash
cat docs/incident-history.log | grep "SYNTAX_ERROR"
```
Look for prior fix attempts on this incident type.

### Step 2: Evaluate Prior Attempts
- If this exact fix failed before → activate **Thinking Mode**
- If fresh incident or prior success → proceed with standard fix

### Step 3: Thinking Mode (If Triggered)
State explicitly: `"[THINKING MODE ACTIVATED] — Prior fix failed. Analyzing alternatives."`
1. List at least 3 alternative approaches
2. Choose the least similar to the failed attempt
3. Document reasoning before applying

### Step 4: Apply Fix + Log Result
```bash
[TIMESTAMP] INCIDENT: <type> | SERVICE: <name> | FIX: <description> | RESULT: SUCCESS|FAILED | THINKING_MODE: YES|NO
```

### Step 5: Verify
```bash
npx tsc --noEmit  # Check TypeScript
npm test          # Run tests
```

---

## 🔌 MCP Integrations (Future)

- **SQLite MCP** — Persist incident state across sessions
- **GitHub MCP** — Detect Chaos Monkey injections via diff

---

## 📚 Files to Read

| File | Purpose |
|------|---------|
| [CLAUDE.md](CLAUDE.md) | Claude agent strict instructions & resolution protocol |
| [AGENTS.md](AGENTS.md) | Multi-agent behavior & escalation rules |
| [docs/incident-history.log](docs/incident-history.log) | Persistent log of all incidents |

---

## 🎓 Learning Path

**Hour 1–2:** Setup  
✅ Clone & install dependencies  
✅ Run `npm run chaos` once  
✅ Check `docs/incident-history.log`  

**Hour 3–4:** Chaos  
✅ Run `npm run chaos` 5 times  
✅ Watch bugs get injected  
✅ Verify log entries  

**Hour 5–6:** Dashboard  
✅ Start Next.js: `npm run app`  
✅ View incidents in real-time  
✅ Filter by status  

**Hour 7–8:** Resolution (Claude Agent)  
✅ Read CLAUDE.md protocol  
✅ Implement fix for one incident  
✅ Log result to incident history  
✅ Verify dashboard updates  

---

## 🐛 Troubleshooting

### "Port 3000 is in use"
→ Dashboard will auto-detect and use 3001. Just open `http://localhost:3001`

### "No incidents showing in dashboard"
→ Run `npm run chaos` at least once, then check `docs/incident-history.log`  
→ Ensure Next.js is running and `/api/incidents` endpoint is reachable

### "Bug injection failed"
→ The mutation logic may not apply to that file. Run chaos monkey again to try a different service/bug type

### TypeScript errors
→ Ensure `tsconfig.json` has `"strict": true`  
→ Run `npx tsc --noEmit` to validate

---

## 📞 Support

For issues or clarifications:
1. Read [CLAUDE.md](CLAUDE.md) — All agent behavior is defined there
2. Check [docs/incident-history.log](docs/incident-history.log) — Trace prior fixes
3. Review code in `scripts/chaos-monkey.ts` — See how mutations work

---

## 📄 License

ISC

---

**Happy chaos engineering! 🚀**
