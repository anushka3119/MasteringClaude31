# 🐵 Chaos Engineering + Claude AI Incident Resolution System

A complete chaos engineering system where Claude acts as an autonomous agent that detects, investigates, and resolves bugs injected by the Chaos Monkey script. A Next.js dashboard visualizes live incident state in dark mode with real-time service health monitoring.

---

## 🎯 Project Overview

### Architecture
- **Chaos Monkey** (`scripts/chaos-monkey.ts`) — Randomly injects 5 types of bugs into microservices
- **Microservices** (`services/`) — Auth, Analytics, Notification, Payment services (Node.js + Express)
- **SQLite Database** (`data/incidents.db`) — Persistent incident tracking
- **Dashboard** (`ClaudeSubAgentIntegration/app/`) — Next.js dark-mode UI for real-time incident tracking
- **API Routes** — Backend endpoints for incidents and health

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
├── package.json                       # Root scripts and dependencies
├── tsconfig.json                      # TypeScript configuration
├── data/
│   └── incidents.db                   # SQLite database for incident tracking
├── scripts/
│   ├── chaos-monkey.ts               # Bug injection orchestrator
│   ├── auto-fix.ts                   # Auto-fix script (optional)
│   ├── init-db.ts                    # Initialize SQLite database
│   └── sqlite-sync.ts                # Mark incidents as resolved
├── services/
│   ├── auth-service/                 # Authentication microservice (port 4001)
│   ├── analytics-service/            # Analytics tracking service (port 4002)
│   ├── notification-service/         # Notification dispatcher (port 4003)
│   └── payment-service/              # Payment processor (port 4004)
├── docs/
│   └── incident-history.log          # Incident history log
└── ClaudeSubAgentIntegration/app/    # Next.js Dashboard
    └── app/
        ├── page.tsx                  # Main dashboard component
        ├── api/
        │   ├── incidents/route.ts    # Incident API (reads from SQLite)
        │   ├── health/route.ts        # Health check API
        │   └── notify/route.ts       # Notification API
        └── ...
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Step 1: Install Dependencies

**Root dependencies:**
```bash
cd "c:\d-disk shifted\Downloads\mc"
npm install
```

**Dashboard dependencies:**
```bash
cd ClaudeSubAgentIntegration\app
npm install
cd ../..
```

### Step 2: Initialize SQLite Database
```bash
npm run init-db
```
This creates `data/incidents.db` and syncs existing log entries.

### Step 3: Start the Dashboard
```bash
npm run app
```
Dashboard runs at `http://localhost:3000`

---

## 🔧 How to Use

### Workflow 1: Inject Bug & Fix Manually

**1. Inject a bug:**
```bash
npm run chaos
```
- Bug injected into a random service
- Incident logged to both log file and SQLite
- Dashboard shows **1 Active** incident

**2. View the incident:**
- Open dashboard at `http://localhost:3000`
- See the bug in "ACTIVE INCIDENTS" section

**3. Ask Claude to fix:**
- Say "fix it" to Claude
- Claude removes injected code and marks as resolved

**4. Mark as resolved in SQLite:**
```bash
npx ts-node scripts/sqlite-sync.ts <service> <type> "<fix description>"
```
Example:
```bash
npx ts-node scripts/sqlite-sync.ts payment-service LOGIC_ERROR "Fixed if statement"
```

**5. Dashboard auto-updates:**
- Shows **0 Active**, **+1 Resolved**
- Popup notification appears for 3.5 seconds

### Workflow 2: Full System with Services Running

**Start all services:**
```bash
npm run test-services
```
This starts all 4 microservices on ports 4001-4004.

**Check health:**
- Dashboard sidebar shows service status (online/offline)
- Health API: `http://localhost:3000/api/health`

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run chaos` | Inject a random bug into a service |
| `npm run init-db` | Initialize SQLite database and sync from log |
| `npm run app` | Start Next.js dashboard |
| `npm run test-services` | Start all microservices |
| `npm run test` | Run regression tests |
| `npm run subagent` | Run multi-agent orchestration demo |
| `npx ts-node scripts/sqlite-sync.ts <service> <type> "<desc>"` | Mark incident as resolved |

---

## 🎛️ MCP Configuration

The project includes MCP (Model Context Protocol) integration for SQLite:

**Location:** `C:\Users\Anushka Gupta\.claude\settings.json`

```json
{
  "mcpServers": {
    "sqlite-incidents": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "C:\\d-disk shifted\\Downloads\\mc\\data\\incidents.db"]
    }
  }
}
```

---

## 🚀 Vercel Deployment Setup

### GitHub Action
The project includes a GitHub Action workflow at `.github/workflows/deploy.yml` that automatically deploys the dashboard to Vercel on push to main.

### Required Secrets
To enable automatic deployment, add these secrets to your GitHub repository:

1. **VERCEL_TOKEN** - Your Vercel personal access token
2. **VERCEL_ORG_ID** - Your Vercel organization ID
3. **VERCEL_PROJECT_ID** - Your Vercel project ID

### Setup Steps
1. Create a Vercel account and project for the dashboard
2. Generate a Vercel token from Account Settings
3. Add secrets to GitHub repository Settings > Secrets and variables > Actions
4. Push to main branch to trigger deployment

---

## 📊 Dashboard Features

- **Dark-mode UI** with cyberpunk aesthetics
- **Active Incidents** counter (from SQLite)
- **Resolved by Claude** counter
- **System Health** gauge (based on service status)
- **Service Status** panel (shows online/offline for each service)
- **Bug Type Legend** with color coding
- **Notification Popup** when incidents are resolved (3.5s)
- **Auto-refresh** every 5 seconds

---

## 🔄 Current Status

| Feature | Status |
|---------|--------|
| Chaos Monkey (5 bug types) | ✅ Working |
| SQLite Database | ✅ Working |
| Dashboard (Dark Mode) | ✅ Working |
| Auto-update after fix | ✅ Working |
| Popup notification | ✅ Working |
| Service Health Monitoring | ✅ Working |
| MCP Integration Config | ✅ Configured |
| Multi-Agent Orchestration | ✅ Demo available |
| Regression Tests (npm test) | ✅ 9 tests passing |
| GitHub Action (Vercel) | ✅ Workflow created |

---

## 🤖 Multi-Agent Orchestration

The project demonstrates multi-agent coordination:

### Agent Roles
- **Main Agent** - Orchestrates the workflow, coordinates subagents
- **Subagent Alpha (Debugger)** - Analyzes service code for errors
- **Subagent Beta (QA)** - Creates regression tests to prevent bug recurrence

### Run the Demo
```bash
npm run subagent -- payment-service
```

### Output
```
🎯 [Main Agent] Starting multi-agent workflow

🔍 [Subagent Alpha] Starting debugging...
   Task: Analyze payment-service for errors
🧪 [Subagent Beta] Starting test creation...
   Task: Create regression test for NULL_DEREF in payment-service
✅ [Subagent Beta] Tests created
✅ [Subagent Alpha] Analysis complete

📊 [Main Agent] Results:
   Debugger: Found: Unhandled null reference on line 45
   QA: Test created for NULL_DEREF prevention in payment-service

✅ Workflow complete!
```

---

## 🧪 Regression Tests

Run tests to ensure no injected bugs remain and the system works correctly:

```bash
npm test
```

### Test Coverage
- Service health endpoints exist
- No forbidden bug patterns in code (regression check)
- SQLite database accessible
- Resolved incidents tracked
- Dashboard API endpoints work

**Result:** 9 tests passing ✅

---

## 📦 Assignment Deliverables

### 1. GitHub Repository
The complete project is in this repository with:
- Full source code
- CLAUDE.md with detailed instructions
- Scripts for chaos monkey, auto-fix, and multi-agent
- Next.js dashboard
- SQLite database integration

### 2. Agent Logs
Detailed resolution session logs are available at:
- **`docs/agent-logs.md`** - Contains a complete session showing:
  - Plan Mode activation and strategy
  - Multi-agent orchestration (Main Agent + Subagent Alpha)
  - Bug injection → Diagnosis → Fix → Verification workflow
  - Dashboard updates and popup notifications
  - Test results and post-mortem generation

Key session details:
- Demonstrates `/plan` mode for strategy planning
- Demonstrates `/subagent` spawning for parallel work
- Shows npm test verification (9 tests passing)
- Shows SQLite database updates

### 3. Loom Video (3 minutes)
Video demonstration showing:
1. Running `npm run chaos` to inject a bug
2. NOT touching keyboard - directing Claude verbally
3. Claude using Plan Mode to analyze
4. Claude spawning subagent to fix code
5. Main agent updating dashboard
6. Running `npm test` to verify
7. Dashboard showing 0 Active, popup notification

---

## 🧹 Troubleshooting

**Dashboard shows 0 Active but should show 1:**
- Run: `npm run init-db` to re-sync from log

**Services showing as offline:**
- Start services: `npm run test-services`

**Popup not appearing:**
- Refresh the dashboard page

---

## 📝 CLAUDE.md

The project includes strict instructions for Claude at `CLAUDE.md`:
- TypeScript strict mode rules
- Naming conventions (PascalCase, SCREAMING_SNAKE_CASE)
- Resolution Protocol (check history → apply fix → log result)
- No `any` types allowed