import Database from 'better-sqlite3';

const DB_PATH = 'C:\\d-disk shifted\\Downloads\\mc\\data\\incidents.db';

const db = new Database(DB_PATH);

// Delete all incidents to start fresh
const result = db.prepare("DELETE FROM incidents").run();
console.log(`Deleted ${result.changes} incidents`);

db.close();
console.log('Database cleared. Restart dashboard for fresh start.');