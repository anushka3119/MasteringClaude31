import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// Connect to SQLite database
const DB_PATH = 'C:/Users/Anushka Gupta/OneDrive/Desktop/INTERN/ASSIGNMENT2/mc/data/incidents.db';

export interface IIncident {
  id: string;
  type: 'SYNTAX_ERROR' | 'TYPE_MISMATCH' | 'LOGIC_ERROR' | 'ASYNC_ERROR' | 'NULL_DEREF';
  service: string;
  filePath: string;
  lineNumber: number;
  originalCode: string;
  injectedCode: string;
  timestamp: string;
  status: 'OPEN' | 'Investigating' | 'Resolved' | 'ESCALATED';
}

export async function GET(request: Request) {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get all incidents from SQLite
    const rows = db.prepare('SELECT * FROM incidents ORDER BY timestamp DESC').all() as any[];

    const incidents: IIncident[] = rows.map((row) => ({
      id: `incident-${row.id}`,
      type: row.type as IIncident['type'],
      service: row.service,
      filePath: row.filePath || 'unknown',
      lineNumber: row.lineNumber || 0,
      originalCode: '',
      injectedCode: '',
      timestamp: row.timestamp,
      status: row.status === 'RESOLVED' ? 'Resolved' : 'OPEN'
    }));

    db.close();

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Error reading incidents from SQLite:', error);
    // Fallback to log file if SQLite fails
    return NextResponse.json({ incidents: [], error: 'Database unavailable' });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { status: string; incidentId: string; type?: string; service?: string; fixDescription?: string; filePath?: string; lineNumber?: number };
    const { status, incidentId, type, service, fixDescription } = body;

    const db = new Database(DB_PATH);

    // If it's a new incident (has type and service), insert it
    if (type && service) {
      const stmt = db.prepare(`
        INSERT INTO incidents (type, service, filePath, lineNumber, status, timestamp, fix_description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        type,
        service,
        body.filePath || null,
        body.lineNumber || null,
        status === 'Resolved' ? 'RESOLVED' : 'OPEN',
        new Date().toISOString(),
        fixDescription || null
      );
    } else if (incidentId) {
      // Update existing incident
      const id = parseInt(incidentId.replace('incident-', ''));
      const stmt = db.prepare(`
        UPDATE incidents SET status = ?, fix_description = ? WHERE id = ?
      `);
      stmt.run(
        status === 'Resolved' ? 'RESOLVED' : status,
        fixDescription || null,
        id
      );
    }

    db.close();

    return NextResponse.json({ success: true, message: 'Status updated in SQLite' });
  } catch (error) {
    console.error('Error updating incident:', error);
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
  }
}