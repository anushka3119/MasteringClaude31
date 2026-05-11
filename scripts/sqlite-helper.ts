// SQLite helper for direct DB writes (used after fixes)
import Database from 'better-sqlite3';

const DB_PATH = 'C:\\d-disk shifted\\Downloads\\mc\\data\\incidents.db';

const db = new Database(DB_PATH);

// Add a new incident (OPEN)
export function addInjectedIncident(type: string, service: string, filePath: string, lineNumber: number): void {
  const stmt = db.prepare(`
    INSERT INTO incidents (type, service, filePath, lineNumber, status, timestamp)
    VALUES (?, ?, ?, ?, 'OPEN', ?)
  `);
  stmt.run(type, service, filePath, lineNumber, new Date().toISOString());
  console.log(`✅ Added INJECTED incident: ${type} in ${service}`);
}

// Mark as RESOLVED - finds the OPEN incident for same service/type and updates it
export function markResolved(type: string, service: string, fixDescription: string): void {
  // Find the most recent OPEN incident for this service/type
  const stmt = db.prepare(`
    UPDATE incidents
    SET status = 'RESOLVED', fix_description = ?
    WHERE id = (
      SELECT id FROM incidents
      WHERE service = ? AND type = ? AND status = 'OPEN'
      ORDER BY timestamp DESC LIMIT 1
    )
  `);
  const result = stmt.run(fixDescription, service, type);
  if (result.changes > 0) {
    console.log(`✅ Marked as RESOLVED: ${type} in ${service}`);
  } else {
    // If no OPEN incident found, just add a new RESOLVED entry
    const insertStmt = db.prepare(`
      INSERT INTO incidents (type, service, status, timestamp, fix_description)
      VALUES (?, ?, 'RESOLVED', ?, ?)
    `);
    insertStmt.run(type, service, new Date().toISOString(), fixDescription);
    console.log(`✅ Added RESOLVED incident: ${type} in ${service}`);
  }
}

// Get notification - latest resolved incident
export function getLatestResolved(): any | null {
  const stmt = db.prepare(`
    SELECT * FROM incidents
    WHERE status = 'RESOLVED'
    ORDER BY timestamp DESC
    LIMIT 1
  `);
  return stmt.get() || null;
}

db.close();

console.log('✅ SQLite helper ready');