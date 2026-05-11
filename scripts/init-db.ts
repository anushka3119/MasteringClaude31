// SQLite Database for Incident Tracking
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.join(__dirname, '..', 'data', 'incidents.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    service TEXT NOT NULL,
    filePath TEXT,
    lineNumber INTEGER,
    status TEXT DEFAULT 'OPEN',
    timestamp TEXT NOT NULL,
    fix_description TEXT,
    thinking_mode INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS service_status (
    service_name TEXT PRIMARY KEY,
    status TEXT DEFAULT 'HEALTHY',
    last_check TEXT,
    error_count INTEGER DEFAULT 0
  );
`);

// Helper functions
export function addIncident(incident: {
  type: string;
  service: string;
  filePath?: string;
  lineNumber?: number;
  status?: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO incidents (type, service, filePath, lineNumber, status, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    incident.type,
    incident.service,
    incident.filePath || null,
    incident.lineNumber || null,
    incident.status || 'OPEN',
    new Date().toISOString()
  );
  return result.lastInsertRowid as number;
}

export function updateIncidentStatus(id: number, status: string, fixDescription?: string): void {
  const stmt = db.prepare(`
    UPDATE incidents
    SET status = ?, fix_description = ?
    WHERE id = ?
  `);
  stmt.run(status, fixDescription || null, id);
}

export function getIncidents(): any[] {
  const stmt = db.prepare('SELECT * FROM incidents ORDER BY timestamp DESC');
  return stmt.all();
}

export function getOpenIncidents(): any[] {
  const stmt = db.prepare("SELECT * FROM incidents WHERE status = 'OPEN' ORDER BY timestamp DESC");
  return stmt.all();
}

export function getResolvedIncidents(): any[] {
  const stmt = db.prepare("SELECT * FROM incidents WHERE status = 'RESOLVED' ORDER BY timestamp DESC");
  return stmt.all();
}

export function updateServiceStatus(serviceName: string, status: string): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO service_status (service_name, status, last_check, error_count)
    VALUES (?, ?, ?, COALESCE((SELECT error_count FROM service_status WHERE service_name = ?), 0) +
      CASE WHEN ? = 'CRITICAL' THEN 1 ELSE 0 END)
  `);
  stmt.run(serviceName, status, new Date().toISOString(), serviceName, status);
}

export function getServiceStatuses(): any[] {
  const stmt = db.prepare('SELECT * FROM service_status');
  return stmt.all();
}

// Sync existing log to SQLite
export function syncFromLog(): void {
  const logPath = path.join(__dirname, '..', 'docs', 'incident-history.log');
  if (!fs.existsSync(logPath)) return;

  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.startsWith('[') && line.includes('INCIDENT:'));

  for (const line of lines) {
    const typeMatch = line.match(/INCIDENT:\s*(\w+)/);
    const serviceMatch = line.match(/SERVICE:\s*(\w+(?:-\w+)*)/);
    const resultMatch = line.match(/RESULT:\s*(\w+)/);
    const fixMatch = line.match(/FIX:\s*([^|]+)/);

    if (typeMatch && serviceMatch) {
      const status = resultMatch?.[1] === 'SUCCESS' ? 'RESOLVED' : 'OPEN';
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO incidents (type, service, status, timestamp, fix_description)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        typeMatch[1],
        serviceMatch[1],
        status,
        line.match(/\[([^\]]+)\]/)?.[1] || new Date().toISOString(),
        fixMatch?.[1] || null
      );
    }
  }
  console.log('✅ Synced incidents from log to SQLite');
}

// Initialize
console.log('✅ SQLite database initialized at:', DB_PATH);

// Run sync if requested
const args = process.argv.slice(2);
if (args.includes('--sync')) {
  syncFromLog();
}

export default db;