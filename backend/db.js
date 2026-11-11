const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'schedule.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS available_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_date TEXT NOT NULL,
    slot_time TEXT NOT NULL,
    UNIQUE(slot_date, slot_time)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'PENDING',
    token TEXT NOT NULL,
    gcal_event_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;