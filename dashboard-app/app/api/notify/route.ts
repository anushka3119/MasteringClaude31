import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const DB_PATH = 'C:/Users/Anushka Gupta/OneDrive/Desktop/INTERN/ASSIGNMENT2/mc/data/incidents.db';

export async function GET(request: Request) {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get the most recent resolved incident (for notification)
    const stmt = db.prepare(`
      SELECT * FROM incidents
      WHERE status = 'RESOLVED'
      ORDER BY timestamp DESC
      LIMIT 1
    `);
    const latestResolved = stmt.get();

    db.close();

    return NextResponse.json({ notification: latestResolved || null });
  } catch (error) {
    return NextResponse.json({ notification: null });
  }
}