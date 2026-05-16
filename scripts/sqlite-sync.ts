// Quick script to mark an incident as resolved in SQLite
// Usage: npx ts-node scripts/sqlite-resolve.ts <service> <type> <description>
import Database from 'better-sqlite3';

const DB_PATH = './data/incidents.db';

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('Usage: npx ts-node scripts/sqlite-resolve.ts <service> <type> "<fix description>"');
  console.log('Example: npx ts-node scripts/sqlite-resolve.ts payment-service LOGIC_ERROR "Fixed if statement"');
  process.exit(1);
}

const [service, type, fixDescription] = args;

const db = new Database(DB_PATH);

// Find the most recent OPEN incident for this service/type and mark it RESOLVED
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
  console.log(`✅ Marked ${type} in ${service} as RESOLVED in SQLite`);
} else {
  // No OPEN incident found - add a new RESOLVED entry
  const insertStmt = db.prepare(`
    INSERT INTO incidents (type, service, status, timestamp, fix_description)
    VALUES (?, ?, 'RESOLVED', ?, ?)
  `);
  insertStmt.run(type, service, new Date().toISOString(), fixDescription);
  console.log(`✅ Added new RESOLVED incident: ${type} in ${service}`);
}

db.close();