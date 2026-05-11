# Quick Start Guide — Chaos Engineering System

## ⚡ 5-Minute Setup

### 1. Install Everything
```bash
cd "c:\d-disk shifted\Downloads\mc"
npm install
cd ClaudeSubAgentIntegration\app
npm install
cd ../..
```

### 2. Start Dashboard (Terminal 1)
```bash
cd ClaudeSubAgentIntegration\app
npm run dev
```
→ Opens on `http://localhost:3001`

### 3. Inject Bugs (Terminal 2)
```bash
npm run chaos
npm run chaos
npm run chaos
```

### 4. Watch Dashboard Update
The dashboard polls `/api/incidents` every 5 seconds and displays:
- 🔴 All injected bugs as OPEN incidents
- 📊 Health score (drops as incidents increase)
- 📋 Incident list with timestamps

---

## 📋 Full Command Reference

### Chaos Monkey
```bash
# Inject 1 random bug
npm run chaos

# Or run directly
npx ts-node scripts/chaos-monkey.ts
```

### Dashboard
```bash
# Start development server
cd ClaudeSubAgentIntegration\app && npm run dev

# Build for production
npm run build
npm start
```

### Incident Logging
```bash
# View all incidents
Get-Content docs\incident-history.log

# View specific bug type
Get-Content docs\incident-history.log | Select-String "SYNTAX_ERROR"

# Stream new incidents
Get-Content docs\incident-history.log -Wait
```

### Services (Optional)
```bash
# Start all 4 services on ports 4001-4004
node services\auth-service\index.js &
node services\analytics-service\index.js &
node services\notification-service\index.js &
node services\payment-service\index.js &

# Test auth service
curl http://localhost:4001/health

# Test payment service
curl http://localhost:4004/health
```

---

## 🎯 What Each File Does

### `scripts/chaos-monkey.ts`
- Randomly selects a service and bug type
- Mutates code in service files
- Logs incident to `docs/incident-history.log`
- Generates unique incident IDs

### `docs/incident-history.log`
- Persistent log of all injected bugs
- Format: `[TIMESTAMP] INCIDENT: <TYPE> | SERVICE: <name> | FILE: <file> | LINE: <line> | RESULT: INJECTED`
- Read by dashboard API to display incidents

### `ClaudeSubAgentIntegration/app/app/api/incidents/route.ts`
- GET: Reads incident log and returns JSON
- POST: Updates incident status (for future Claude agent)
- Polled every 5 seconds by dashboard

### `ClaudeSubAgentIntegration/app/app/page.tsx`
- React component for dark-mode dashboard
- Displays incidents from API
- Health ring visualization
- Status filtering

---

## 🧠 How It Works (3 Steps)

### Step 1: Injection
```
npm run chaos
→ chaos-monkey.ts runs
→ Picks random service: "payment-service"
→ Picks random bug: "SYNTAX_ERROR"
→ Mutates code: removes semicolon from line 46
→ Logs: [2026-05-11T11:58:36Z] INCIDENT: SYNTAX_ERROR | SERVICE: payment-service | ...
```

### Step 2: Detection
```
Dashboard refreshes every 5 seconds
→ Calls /api/incidents endpoint
→ API reads docs/incident-history.log
→ Parses incident entries
→ Returns JSON array to frontend
```

### Step 3: Display
```
React re-renders with new incidents
→ Shows in sidebar list
→ Updates health score
→ Colors by bug type
→ Timestamps show "just now"
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3001 not responding | Dashboard still compiling. Wait 30 seconds or restart: `npm run dev` |
| No incidents in dashboard | Run `npm run chaos` at least once. Check `docs/incident-history.log` |
| TypeScript errors | Run `npx tsc --noEmit` to see specific errors |
| Service won't start | Ensure Node.js is installed: `node --version` |
| Module not found errors | Run `npm install` in the root and app directories |

---

## 📊 Dashboard UI Walkthrough

### Left Sidebar
- **Title:** "🐵 CHAOS DASHBOARD"
- **Health Ring:** Circular gauge showing system health 0-100
  - Green (80+) = GOOD
  - Yellow (50-80) = FAIR
  - Red (<50) = CRITICAL
- **Open Count:** Number of unresolved incidents
- **Filter Buttons:** ALL, OPEN, Investigating, Resolved, ESCALATED
- **Incident List:** Scrollable list of all incidents

### Incident Card (in list)
- **Bug Type Badge:** Color-coded (RED=NULL_DEREF, PURPLE=TYPE_MISMATCH, etc.)
- **Service Name:** Which service has the bug
- **Description:** Human-readable incident summary
- **File Path:** Location of injected code
- **Time Ago:** "2m ago" format
- **Status:** OPEN, Investigating, etc.

### Main Content Area
- **No incident selected:** Shows welcome message
- **Incident selected:** Shows detailed view with:
  - Full incident ID
  - Bug type, service, file path
  - Fix attempts count
  - Thinking mode status
  - Original vs injected code (future)

---

## 🐛 Bug Types & What They Do

```javascript
// SYNTAX_ERROR: Remove semicolon
res.json({ success: true })
↓
res.json({ success: true })

// TYPE_MISMATCH: Change value type
const limit = parseInt(req.query.limit);
↓
const limit = "broken" || parseInt(req.query.limit);

// LOGIC_ERROR: Flip operator
if (result === expected) {
↓
if (result !== expected) {

// ASYNC_ERROR: Remove await
await fetch(url);
↓
fetch(url);

// NULL_DEREF: Unsafe property access
const { id } = obj;
↓
const { id } = obj?.id  // Will fail
```

---

## 📈 Scaling to Multiple Incidents

```bash
# Generate 10 incidents rapidly
for ($i=1; $i -le 10; $i++) { npm run chaos }

# Watch them appear in dashboard (refresh browser)
http://localhost:3001

# Check health score drops
# Each incident: -15 health

# View log growth
wc -l docs\incident-history.log
```

---

## 🚀 Production Checklist

- [ ] Run `npx tsc --noEmit` to verify no TypeScript errors
- [ ] Run `npm run build` in app directory to optimize
- [ ] Test dashboard at `npm start` (production mode)
- [ ] Verify `/api/incidents` returns valid JSON
- [ ] Test incident log parsing with malformed entries
- [ ] Add error boundaries to dashboard components
- [ ] Implement incident status update API (POST endpoint)
- [ ] Add SQLite MCP for persistent state (optional)

---

## 📚 Additional Resources

- [CLAUDE.md](../CLAUDE.md) — Strict agent instructions & resolution protocol
- [AGENTS.md](../AGENTS.md) — Multi-agent orchestration & escalation
- [README.md](../README.md) — Full documentation
- [docs/incident-history.log](../docs/incident-history.log) — Live incident log

---

**Last Updated:** 2026-05-11  
**Status:** ✅ Fully Functional  
**Dashboard:** http://localhost:3001
