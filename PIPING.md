# Piping Guide — CLI Integration with Claude

This guide demonstrates Phase 2.3 of the project: **Piping error logs to Claude for analysis and dashboard updates**.

---

## 📝 Overview

The piping pattern allows you to:

1. **Generate an error** from a buggy service
2. **Capture the error log** to a file
3. **Pipe the log** to Claude via CLI
4. **Claude analyzes** the error and identifies the incident type
5. **Claude updates** the dashboard status in `docs/incident-history.log`
6. **Dashboard polls** and displays the updated status

---

## 🔄 Piping Workflow

### Example Command Pattern

```bash
cat services/error.log | claude -p "Analyze this error log. What type of incident is it? Update docs/incident-history.log with status 'Investigating'."
```

### Step-by-Step

#### 1. Inject a Bug
```bash
cd "c:\d-disk shifted\Downloads\mc"
npm run chaos
```
**Output:**
```
✅ Bug injected successfully!
   ID: incident-1778500711846-zk3gmkz66
   File: index.js
   Line: 18
   Type: NULL_DEREF
```

#### 2. Attempt to Run the Buggy Service
```bash
cd services\payment-service
node index.js
```

This will either:
- **Succeed with warning** (if syntax error doesn't break startup)
- **Crash with error** (if the bug causes runtime failure)

#### 3. Capture the Error
If the service crashes, the error will be in stdout. Redirect to file:

```bash
node index.js 2> error.log
```

Or manually create a log:
```bash
echo "TypeError: Cannot read property 'id' of undefined at line 18 in index.js" > services/error.log
```

#### 4. Pipe to Claude

**Option A: Using claude CLI (if installed)**
```bash
Get-Content services/error.log | claude -p "Analyze this error. What type of incident is it? Update the dashboard."
```

**Option B: Manual analysis**
Instead, you can manually read and update:

```bash
# Read the error
Get-Content services/error.log

# Manually update the log based on what you learn
echo "[2026-05-11T12:00:15.124Z] UPDATE: Incident incident-1778500711846-zk3gmkz66 status changed to Investigating" >> docs/incident-history.log

# Dashboard will pick it up on next refresh
```

---

## 📊 Example: Full Piping Workflow

### Start with a Buggy Service

**Step 1: Inject NULL_DEREF bug**
```bash
npm run chaos
# Output: Injected NULL_DEREF in analytics-service line 18
```

**Step 2: Create an error scenario**
```bash
# Manually create error log (simulating runtime failure)
$error_msg = @"
TypeError: Cannot read property 'eventName' of undefined
    at AnalyticsService.trackEvent (file:///C:/d-disk%20shifted/Downloads/mc/services/analytics-service/index.js:18:45)
    at Layer.handle [as handle_request] (/node_modules/express/lib/router/layer.js:95:16)
    
Root Cause: Line 18 accesses req.body.eventName without null check
"@

Set-Content -Path services/error.log -Value $error_msg
```

**Step 3: Pipe to Claude (simulated)**
```bash
# In real usage with claude CLI:
# Get-Content services/error.log | claude -p "Analyze this error. Identify the incident type and update docs/incident-history.log to 'Investigating'"

# For now, manually update:
echo "[2026-05-11T12:05:00.000Z] UPDATE: Incident analytics-service NULL_DEREF status changed to Investigating" >> docs/incident-history.log
```

**Step 4: Dashboard reflects update**
- Polls `/api/incidents` every 5 seconds
- Sees the UPDATE entry
- Changes incident status from OPEN to Investigating
- Updates health calculation

---

## 🤖 What Claude Does (in Piping)

When you pipe an error log to Claude, the agent:

1. **Parses the error** — Identifies the error type (TypeError, ReferenceError, etc.)
2. **Maps to bug type** — Correlates with one of the 5 chaos bugs:
   - `TypeError: Cannot read property` → NULL_DEREF
   - `ReferenceError: X is not defined` → SYNTAX_ERROR
   - `Type mismatch in operation` → TYPE_MISMATCH
   - `Promise not awaited` → ASYNC_ERROR
   - `Logic error in condition` → LOGIC_ERROR

3. **Finds the service** — Extracts service name from stack trace
4. **Updates the log** — Appends a status update:
   ```
   [TIMESTAMP] UPDATE: Incident <id> status changed to Investigating
   ```

5. **Optional: Suggests fix** — AI might suggest a fix strategy
6. **Triggers resolution** — Claude can auto-apply the fix (future feature)

---

## 💾 Incident History Log Anatomy

**Before piping:**
```
[2026-05-11T11:58:31.847Z] INCIDENT: NULL_DEREF | SERVICE: analytics-service | FILE: index.js | LINE: 18 | RESULT: INJECTED
```

**After piping (Claude analyzes):**
```
[2026-05-11T11:58:31.847Z] INCIDENT: NULL_DEREF | SERVICE: analytics-service | FILE: index.js | LINE: 18 | RESULT: INJECTED
[2026-05-11T12:00:15.124Z] UPDATE: Incident incident-1778500711846-zk3gmkz66 status changed to Investigating
```

**After Claude fixes:**
```
[2026-05-11T11:58:31.847Z] INCIDENT: NULL_DEREF | SERVICE: analytics-service | FILE: index.js | LINE: 18 | RESULT: INJECTED
[2026-05-11T12:00:15.124Z] UPDATE: Incident incident-1778500711846-zk3gmkz66 status changed to Investigating
[2026-05-11T12:05:32.891Z] INCIDENT: NULL_DEREF | SERVICE: analytics-service | FIX: Added null check and optional chaining | RESULT: SUCCESS | THINKING_MODE: NO
```

---

## 🔌 Integration Points

### Where Piping Fits

```
┌─────────────────┐
│  Chaos Monkey   │  ← Injects bug
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Service Runs   │  ← Runtime error occurs
└────────┬────────┘
         │
         ↓ stderr redirected
┌─────────────────┐
│ error.log file  │  ← Captures the error
└────────┬────────┘
         │
         ↓ cat services/error.log |
┌─────────────────┐
│  Claude via CLI │  ← Analyzes & updates log ⭐ PIPING HERE
└────────┬────────┘
         │
         ↓ appends entry to
┌─────────────────┐
│ incident-history.log │  ← Status updated
└────────┬────────┘
         │
         ↓ /api/incidents polls
┌─────────────────┐
│  Dashboard      │  ← Shows Investigating status
└─────────────────┘
```

---

## 📋 Command Examples

### Example 1: Pipe a Simple Error

```bash
# Generate a simple error message
$err = "ERROR: Cannot parse JSON at line 18 - unexpected token"
echo $err | claude -p "What type of incident is this? Is it SYNTAX_ERROR, TYPE_MISMATCH, LOGIC_ERROR, ASYNC_ERROR, or NULL_DEREF? Respond with just the type name."
```

**Claude responds:** `SYNTAX_ERROR`

### Example 2: Pipe a Stack Trace

```bash
# Capture real error from service
$error_file = "services/analytics-service/error.log"
Get-Content $error_file | claude -p "Analyze this stack trace. Identify: 1) Bug type (SYNTAX_ERROR|TYPE_MISMATCH|LOGIC_ERROR|ASYNC_ERROR|NULL_DEREF), 2) Service name, 3) Line number. Then update docs/incident-history.log with status change to Investigating."
```

**Claude processes:**
- Reads the error log from pipe
- Extracts info from stack trace
- Appends to incident-history.log:
  ```
  [2026-05-11T12:05:32.891Z] UPDATE: Incident analytics-service NULL_DEREF status changed to Investigating
  ```

### Example 3: Ask Claude to Fix

```bash
# After analysis, ask for fix
Get-Content services/error.log | claude -p "Suggest a fix for this error. What code change would resolve it? Then apply the fix to the source file and update incident status to 'Resolved' in docs/incident-history.log."
```

---

## 🧪 Hands-On Exercise

### Step 1: Create a Test Error Log
```bash
$error = @"
ReferenceError: userId is not defined
    at file:///C:/services/analytics-service/index.js:22:15
    
Incident: analytics-service failed to track event
Error happens when: userId variable accessed but never initialized
Severity: High - breaks event tracking feature
"@

Set-Content -Path services/error.log -Value $error
```

### Step 2: View It
```bash
Get-Content services/error.log
```

### Step 3: Simulate Piping (Manual Analysis)
```bash
# You read the error and identify: LOGIC_ERROR or NULL_DEREF
# Then update the log:

$update = "[$(Get-Date -Format 'O')] UPDATE: Incident analytics-service LOGIC_ERROR status changed to Investigating"
Add-Content -Path docs/incident-history.log -Value $update
```

### Step 4: Check Dashboard
```
Dashboard on http://localhost:3001
→ Refreshes every 5 seconds
→ Reads updated incident-history.log
→ Shows status as "Investigating" instead of "OPEN"
```

---

## 🚀 Future: Automated Piping

Once Claude agent is integrated:

```bash
# Setup automatic error monitoring
watch services/error.log | claude -p "Monitor for errors and update dashboard status"

# Or use a file watcher
onchange 'services/*.log' -- 'cat services/error.log | claude -p "Update dashboard"'
```

---

## ✅ Piping Checklist

- [ ] Understand the 5 bug types
- [ ] Know the incident log format
- [ ] Try manual piping once
- [ ] Verify dashboard updates on log change
- [ ] Test with multiple error types
- [ ] Integrate with your error monitoring

---

## 📚 Related

- [README.md](README.md) — Full project documentation
- [CLAUDE.md](CLAUDE.md) — Agent resolution protocol
- [docs/incident-history.log](docs/incident-history.log) — Live log file

---

**Ready to pipe?** Run:
```bash
npm run chaos  # Generate an incident
Get-Content docs/incident-history.log  # View it
# Then pipe your own error logs!
```
