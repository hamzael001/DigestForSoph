import Database from 'better-sqlite3';
import path from 'path';

// Initialize database
const db = new Database('digestive_health.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    bristol_score INTEGER NOT NULL, -- 1-7
    color TEXT NOT NULL,
    quantity TEXT, -- Small, Medium, Large
    urgency TEXT, -- None, Urgent, Emergency
    pain_level INTEGER, -- 0-10
    notes TEXT,
    has_blood BOOLEAN DEFAULT 0,
    has_mucus BOOLEAN DEFAULT 0,
    is_floating BOOLEAN DEFAULT 0, -- Indicator of malabsorption (steatorrhea)
    smell TEXT -- Normal, Strong, Foul
  );
`);

export interface LogEntry {
  id?: number;
  timestamp: string;
  bristol_score: number;
  color: string;
  quantity: string;
  urgency: string;
  pain_level: number;
  notes: string;
  has_blood: boolean;
  has_mucus: boolean;
  is_floating: boolean;
  smell: string;
}

export const addLog = (entry: LogEntry) => {
  const stmt = db.prepare(`
    INSERT INTO logs (timestamp, bristol_score, color, quantity, urgency, pain_level, notes, has_blood, has_mucus, is_floating, smell)
    VALUES (@timestamp, @bristol_score, @color, @quantity, @urgency, @pain_level, @notes, @has_blood, @has_mucus, @is_floating, @smell)
  `);
  return stmt.run({
    ...entry,
    has_blood: entry.has_blood ? 1 : 0,
    has_mucus: entry.has_mucus ? 1 : 0,
    is_floating: entry.is_floating ? 1 : 0
  });
};

export const getLogs = () => {
  const stmt = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC');
  const logs = stmt.all() as any[];
  // Convert booleans back
  return logs.map(log => ({
    ...log,
    has_blood: !!log.has_blood,
    has_mucus: !!log.has_mucus,
    is_floating: !!log.is_floating
  }));
};

export const deleteLog = (id: number) => {
  const stmt = db.prepare('DELETE FROM logs WHERE id = ?');
  return stmt.run(id);
};
