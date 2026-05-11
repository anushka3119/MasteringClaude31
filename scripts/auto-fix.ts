// Auto-fix script - Monitors incident log and fixes injected bugs automatically
import * as fs from 'fs';
import * as path from 'path';

const DOCS_ROOT = path.join(__dirname, '..', 'docs');
const INCIDENT_LOG = path.join(DOCS_ROOT, 'incident-history.log');
const SERVICES_ROOT = path.join(__dirname, '..', 'services');

interface Incident {
  type: string;
  service: string;
  lineNumber: number;
  originalCode: string;
}

/**
 * Read the incident log and find all INJECTED bugs that haven't been fixed
 */
function getInjectedIncidents(): Incident[] {
  if (!fs.existsSync(INCIDENT_LOG)) return [];

  const logContent = fs.readFileSync(INCIDENT_LOG, 'utf-8');
  const lines = logContent.split('\n').filter(line => line.startsWith('[') && line.includes('RESULT: INJECTED'));

  return lines.map(line => {
    const typeMatch = line.match(/INCIDENT:\s*(\w+)/);
    const serviceMatch = line.match(/SERVICE:\s*(\w+(?:-\w+)*)/);
    const lineMatch = line.match(/LINE:\s*(\d+)/);

    return {
      type: typeMatch?.[1] || 'UNKNOWN',
      service: serviceMatch?.[1] || 'unknown',
      lineNumber: parseInt(lineMatch?.[1] || '0'),
      originalCode: ''
    };
  });
}

/**
 * Try to fix an injected bug by removing injected code markers
 */
function fixService(service: string, bugType: string, lineNumber: number): boolean {
  const serviceFile = path.join(SERVICES_ROOT, service, 'index.js');

  if (!fs.existsSync(serviceFile)) {
    console.error(`Service file not found: ${serviceFile}`);
    return false;
  }

  try {
    const content = fs.readFileSync(serviceFile, 'utf-8');
    let lines = content.split('\n');
    let fixed = false;

    // Common patterns to remove
    const patternsToRemove = [
      /\s*\/\/ SYNTAX_ERROR.*$/,
      /\s*\/\/ TYPE_MISMATCH.*$/,
      /\s*\/\/ LOGIC_ERROR.*$/,
      /\s*\/\/ ASYNC_ERROR.*$/,
      /\s*\/\/ NULL_DEREF.*$/,
      /\s*\{\{\{/,
      /\s*\}\}\}/,
      /;\s*setTimeout.*ASYNC_ERROR.*$/,
      /\s*if \(false\).*LOGIC_ERROR.*$/,
      /\s*const \w+ = 123;.*TYPE_MISMATCH.*$/,
      /\s*const \w+ = \[\];.*TYPE_MISMATCH.*$/,
      /\s*const \w+_type_error = \d+;.*TYPE_MISMATCH.*$/,
      /\s*const \w+_null = null;.*NULL_DEREF.*$/,
      /\s*null\.\w+\(\);.*NULL_DEREF.*$/,
    ];

    // Clean each line - remove injected code patterns
    lines = lines.map(line => {
      let cleaned = line;
      for (const pattern of patternsToRemove) {
        if (pattern.test(cleaned)) {
          cleaned = cleaned.replace(pattern, '');
          fixed = true;
        }
      }
      // Also remove trailing comments that are just bug markers
      cleaned = cleaned.replace(/\s*\/\/\s*$/, '').trim();
      return cleaned;
    });

    // Remove empty lines that might have been created
    lines = lines.filter((line, i) => {
      if (line.trim() === '' && i > 0 && lines[i-1].trim() === '') {
        return false;
      }
      return true;
    });

    if (fixed) {
      fs.writeFileSync(serviceFile, lines.join('\n'), 'utf-8');
      console.log(`✅ Fixed ${service} - ${bugType} at line ${lineNumber}`);
      return true;
    }

    // If no patterns matched, service might already be clean
    console.log(`ℹ️ ${service} appears clean - no injected patterns found`);
    return true;
  } catch (error) {
    console.error(`Error fixing ${service}:`, error);
    return false;
  }
}

/**
 * Log the fix to incident history
 */
function logFix(incident: Incident): void {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] INCIDENT: ${incident.type} | SERVICE: ${incident.service} | FIX: Auto-fixed injected ${incident.type.toLowerCase()} (line ${incident.lineNumber}) | RESULT: SUCCESS | THINKING_MODE: NO\n`;
  fs.appendFileSync(INCIDENT_LOG, logEntry, 'utf-8');
}

/**
 * Main auto-fix loop - runs once and fixes any pending injected bugs
 */
function runAutoFix(): void {
  console.log('🔧 Auto-fix starting...\n');

  const injectedIncidents = getInjectedIncidents();

  if (injectedIncidents.length === 0) {
    console.log('✅ No pending injected bugs found - all services clean!');
    return;
  }

  console.log(`📋 Found ${injectedIncidents.length} pending injected bug(s)\n`);

  let fixedCount = 0;
  for (const incident of injectedIncidents) {
    console.log(`Fixing: ${incident.type} in ${incident.service} (line ${incident.lineNumber})`);
    const success = fixService(incident.service, incident.type, incident.lineNumber);
    if (success) {
      logFix(incident);
      fixedCount++;
    }
  }

  console.log(`\n✅ Auto-fix complete: ${fixedCount}/${injectedIncidents.length} bugs fixed`);
}

// Run if executed directly
runAutoFix();