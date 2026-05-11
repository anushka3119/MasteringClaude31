# AGENTS.md — Multi-Agent Behavior Specification

## Agent Roles

### Orchestrator Agent
Spawned by: Claude Code top-level session
Responsibilities:
- Run `scripts/chaos-monkey.ts` on a schedule or on demand
- Spawn Sub-Agents for each detected incident
- Aggregate resolution results to the dashboard

### Sub-Agent (Resolution)
Spawned by: Orchestrator, one per active incident
Responsibilities:
- Read `docs/incident-history.log` before any fix (mandatory per CLAUDE.md)
- Apply fix to the affected service file
- Run `npx tsc --noEmit` and `npm test` to verify
- Update log with result
- Report back to Orchestrator

## Inter-Agent Communication
- Shared state via SQLite MCP (`incidents` table)
- Each agent writes its own rows — never overwrites another agent's row
- Dashboard polls SQLite every 5 seconds

## Escalation Rules
- If Sub-Agent fails 2 fix attempts → escalate to Orchestrator with full trace
- Orchestrator can spawn a second Sub-Agent with Thinking Mode pre-enabled
- Maximum 3 fix attempts per incident before marking `ESCALATED`
