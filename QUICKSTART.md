# Quick Start — Project Sentinel

## 5-Minute Setup

```bash
# 1. Install dependencies
npm install
cd ClaudeSubAgentIntegration/app && npm install && cd ../..

# 2. Initialize database
npm run init-db

# 3. Start dashboard (Terminal 1)
npm run app
# Opens: http://localhost:3000

# 4. Inject bugs (Terminal 2)
npm run chaos
```

---

## Demo Flow

1. **Run chaos:** `npm run chaos` → Bug injected into random service
2. **Dashboard shows:** 1 Active incident (red indicator)
3. **Tell Claude:** "fix it" or use Plan Mode (Shift+Tab x2)
4. **Claude:** Spawns subagent → finds bug → fixes code
5. **Verify:** Dashboard shows 0 Active, +1 Resolved
6. **Run tests:** `npm test` → 9 tests passing

---

## Commands

```bash
npm run chaos          # Inject random bug
npm run app           # Start dashboard
npm run init-db       # Reset database
npm run test-services # Start all services (ports 4001-4004)
npm test              # Run regression tests
npm run subagent -- <service>  # Multi-agent demo
```

---

## What Each Part Does

- **Chaos Monkey** — Randomly breaks one of 4 services
- **Dashboard** — Dark-mode UI showing incidents & health
- **SQLite** — Tracks incidents persistently
- **CLAUDE.md** — Instructions for Claude to autonomously fix bugs

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Dashboard not loading | Wait 30s, then `npm run app` again |
| No incidents showing | Run `npm run chaos` first |
| Tests failing | Run `npm run chaos` then tell Claude to fix |

---

**Dashboard:** http://localhost:3000 | **Status:** Ready to demo