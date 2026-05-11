import * as fs from 'fs';
import * as path from 'path';

// Types matching CLAUDE.md strict requirements
interface IIncident {
  id: string;
  type: 'SYNTAX_ERROR' | 'TYPE_MISMATCH' | 'LOGIC_ERROR' | 'ASYNC_ERROR' | 'NULL_DEREF';
  service: string;
  filePath: string;
  lineNumber: number;
  originalCode: string;
  injectedCode: string;
  timestamp: string;
}

const BUG_TYPES = [
  'SYNTAX_ERROR',
  'TYPE_MISMATCH',
  'LOGIC_ERROR',
  'ASYNC_ERROR',
  'NULL_DEREF'
] as const;

type BugType = typeof BUG_TYPES[number];

const SERVICES = [
  'auth-service',
  'analytics-service',
  'notification-service',
  'payment-service'
] as const;

const SERVICES_ROOT = path.join(__dirname, '..', 'services');
const DOCS_ROOT = path.join(__dirname, '..', 'docs');

// Ensure docs directory exists
if (!fs.existsSync(DOCS_ROOT)) {
  fs.mkdirSync(DOCS_ROOT, { recursive: true });
}

const INCIDENT_LOG = path.join(DOCS_ROOT, 'incident-history.log');

/**
 * Initialize incident history log if it doesn't exist
 */
function initializeIncidentLog(): void {
  if (!fs.existsSync(INCIDENT_LOG)) {
    const header = `=== INCIDENT HISTORY LOG ===
Created: ${new Date().toISOString()}
This log tracks all chaos engineering incidents and fix attempts.
Format: [TIMESTAMP] INCIDENT: <type> | SERVICE: <name> | FIX: <description> | RESULT: <success|failed> | THINKING_MODE: <yes|no>

--- INCIDENTS ---
`;
    fs.writeFileSync(INCIDENT_LOG, header, 'utf-8');
  }
}

/**
 * Log an incident to the history file
 */
function logIncident(incident: IIncident, result: 'INJECTED'): void {
  const timestamp = new Date().toISOString();
  // Ensure file ends with newline before appending
  const fileContent = fs.existsSync(INCIDENT_LOG) ? fs.readFileSync(INCIDENT_LOG, 'utf-8') : '';
  if (fileContent && !fileContent.endsWith('\n')) {
    fs.appendFileSync(INCIDENT_LOG, '\n', 'utf-8');
  }
  const logEntry = `[${timestamp}] INCIDENT: ${incident.type} | SERVICE: ${incident.service} | FILE: ${path.basename(incident.filePath)} | LINE: ${incident.lineNumber} | RESULT: ${result}\n`;
  fs.appendFileSync(INCIDENT_LOG, logEntry, 'utf-8');

  // Also write to SQLite for dashboard
  try {
    const Database = require('better-sqlite3');
    const DB_PATH = path.join(__dirname, '..', 'data', 'incidents.db');
    const db = new Database(DB_PATH);
    const stmt = db.prepare(`
      INSERT INTO incidents (type, service, filePath, lineNumber, status, timestamp)
      VALUES (?, ?, ?, ?, 'OPEN', ?)
    `);
    stmt.run(incident.type, incident.service, path.basename(incident.filePath), incident.lineNumber, timestamp);
    db.close();
    console.log('✅ Also logged to SQLite database');
  } catch (e: any) {
    console.log('⚠️ Could not write to SQLite:', e.message);
  }
}

/**
 * Generate random bug based on type - guaranteed to be different from original
 */
function generateBug(bugType: BugType, originalCode: string): string {
  const lines = originalCode.split('\n');
  let mutated = originalCode;

  switch (bugType) {
    case 'SYNTAX_ERROR':
      // Add syntax errors that are guaranteed to be different
      if (originalCode.includes('const') || originalCode.includes('let')) {
        mutated = originalCode.replace(/;/g, ''); // Remove semicolons
        mutated += ' // SYNTAX_ERROR: missing semicolon';
      } else if (originalCode.includes('(')) {
        mutated = originalCode.replace(/\(/g, '((('); // Add extra parentheses
      } else if (originalCode.includes('{')) {
        mutated = originalCode.replace(/\{/g, '{{'); // Add extra braces
      } else {
        mutated = originalCode + ' {{{ // SYNTAX_ERROR';
      }
      break;

    case 'TYPE_MISMATCH':
      // Force type mismatches
      if (originalCode.includes('username') || originalCode.includes('password')) {
        mutated = originalCode.replace(/(\w+)\s*=\s*([^;]*)/, '$1 = 12345; // TYPE_MISMATCH: string expected, number given');
      } else if (originalCode.includes('token')) {
        mutated = originalCode.replace(/(\w+)\s*=\s*([^;]*)/, '$1 = {}; // TYPE_MISMATCH: string expected, object given');
      } else if (originalCode.includes('PORT')) {
        mutated = originalCode.replace(/(\w+)\s*=\s*([^;]*)/, '$1 = "not_a_port"; // TYPE_MISMATCH: number expected, string given');
      } else if (originalCode.includes('const') || originalCode.includes('let')) {
        mutated = originalCode.replace(/(\w+)\s*=\s*([^;]*)/, '$1 = []; // TYPE_MISMATCH: wrong type');
      } else {
        mutated = originalCode + ' const chaos_type_error = 123; // TYPE_MISMATCH';
      }
      break;

    case 'LOGIC_ERROR':
      // Introduce logic errors
      if (originalCode.includes('if') && originalCode.includes('!')) {
        mutated = originalCode.replace(/!/g, ''); // Remove negation
        mutated += ' // LOGIC_ERROR: condition inverted';
      } else if (originalCode.includes('return')) {
        mutated = originalCode.replace(/return\s+(.+);/, 'return !$1; // LOGIC_ERROR: return value flipped');
      } else if (originalCode.includes('&&')) {
        mutated = originalCode.replace(/&&/g, '|| // LOGIC_ERROR: AND changed to OR');
      } else if (originalCode.includes('||')) {
        mutated = originalCode.replace(/\|\|/g, '&& // LOGIC_ERROR: OR changed to AND');
      } else if (originalCode.includes('true')) {
        mutated = originalCode.replace(/true/g, 'false // LOGIC_ERROR: true to false');
      } else {
        mutated = originalCode + ' if (false) { console.log("LOGIC_ERROR"); } // LOGIC_ERROR';
      }
      break;

    case 'ASYNC_ERROR':
      // Add async issues
      if (originalCode.includes('app.listen')) {
        mutated = originalCode.replace(/app\.listen/, 'setTimeout(() => app.listen, 1000); // ASYNC_ERROR: callback not invoked');
      } else if (originalCode.includes('res.json')) {
        mutated = originalCode.replace(/res\.json/, 'setTimeout(() => res.json, 100); // ASYNC_ERROR: response not sent');
      } else if (originalCode.includes('console.log')) {
        mutated = originalCode.replace(/console\.log/, 'setTimeout(() => console.log, 1000); // ASYNC_ERROR: delayed execution');
      } else if (originalCode.includes('require')) {
        mutated = originalCode.replace(/require\(/, 'await require('); // Add await to sync call
        mutated += ' // ASYNC_ERROR: await on sync function';
      } else {
        mutated = originalCode + ' setTimeout(() => { throw new Error("ASYNC_ERROR"); }, 1000); // ASYNC_ERROR';
      }
      break;

    case 'NULL_DEREF':
      // Add null reference issues
      if (originalCode.includes('req.body')) {
        mutated = originalCode.replace(/req\.body/, 'null'); // Replace with null
        mutated += ' null.username; // NULL_DEREF: accessing property on null';
      } else if (originalCode.includes('token')) {
        mutated = originalCode.replace(/token/, 'undefined'); // Replace with undefined
        mutated += ' undefined.split(":"); // NULL_DEREF: calling method on undefined';
      } else if (originalCode.includes('decoded')) {
        mutated = originalCode.replace(/(\w+)\s*=\s*([^;]*)/, '$1 = $2; $1.nonexistent; // NULL_DEREF: property does not exist');
      } else if (originalCode.includes('const') || originalCode.includes('let')) {
        mutated = originalCode.replace(/;/, '; chaos_null = null; chaos_null.crash(); // NULL_DEREF');
      } else {
        mutated = originalCode + ' const null_obj = null; null_obj.explode(); // NULL_DEREF';
      }
      break;

    default:
      return originalCode + ' // UNKNOWN_BUG_TYPE';
  }

  return mutated;
}

/**
 * Inject a bug into a service file
 */
function injectBugIntoService(service: string, bugType: BugType): IIncident | null {
  const serviceDir = path.join(SERVICES_ROOT, service);
  const serviceFile = path.join(serviceDir, 'index.js');

  if (!fs.existsSync(serviceFile)) {
    console.error(`Service file not found: ${serviceFile}`);
    return null;
  }

  const fileContent = fs.readFileSync(serviceFile, 'utf-8');
  const lines = fileContent.split('\n');
  
  // Pick a random line that isn't a comment or empty
  let lineIndex = -1;
  let attempts = 0;
  while (attempts < 10) {
    lineIndex = Math.floor(Math.random() * lines.length);
    const line = lines[lineIndex].trim();
    if (line && !line.startsWith('//')) break;
    attempts++;
  }

  if (lineIndex === -1) {
    console.error('Could not find suitable line for injection');
    return null;
  }

  const originalLine = lines[lineIndex];
  const injectedLine = generateBug(bugType, originalLine);

  // Only inject if the line actually changed
  if (originalLine === injectedLine) {
    console.log('Generated bug was identical to original code, skipping');
    return null;
  }

  lines[lineIndex] = injectedLine;
  fs.writeFileSync(serviceFile, lines.join('\n'), 'utf-8');

  const incident: IIncident = {
    id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: bugType,
    service,
    filePath: serviceFile,
    lineNumber: lineIndex + 1,
    originalCode: originalLine,
    injectedCode: injectedLine,
    timestamp: new Date().toISOString()
  };

  logIncident(incident, 'INJECTED');
  return incident;
}

/**
 * Main chaos monkey orchestration
 */
function runChaosMonkey(): void {
  console.log('🐵 Chaos Monkey starting...');
  initializeIncidentLog();

  // Pick random service and bug type
  const randomService = SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const randomBugType = BUG_TYPES[Math.floor(Math.random() * BUG_TYPES.length)];

  console.log(`\n🎯 Target: ${randomService}`);
  console.log(`🐛 Bug Type: ${randomBugType}`);

  const incident = injectBugIntoService(randomService, randomBugType);

  if (incident) {
    console.log(`\n✅ Bug injected successfully!`);
    console.log(`   ID: ${incident.id}`);
    console.log(`   File: ${path.basename(incident.filePath)}`);
    console.log(`   Line: ${incident.lineNumber}`);
    console.log(`   Original: ${incident.originalCode.substring(0, 50)}`);
    console.log(`   Injected: ${incident.injectedCode.substring(0, 50)}`);
    console.log(`\n📝 Incident logged to ${INCIDENT_LOG}`);
  } else {
    console.error('❌ Failed to inject bug');
    process.exit(1);
  }
}

// Run if executed directly
runChaosMonkey();
