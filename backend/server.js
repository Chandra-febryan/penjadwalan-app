const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { insertCalendarEvent } = require('./calendar');
const { sendApprovalEmail } = require('./mailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

function requireAdmin(req, res, next) {
  const authHeader = req.headers['x-admin-key'];
  if (authHeader && authHeader === process.env.ADMIN_SECRET_KEY) {
    return next();
  }
  return res.status(401).json({ error: 'Akses ditolak: PIN Admin salah atau tidak ada.' });
}
// ===================================================== //

// Rute Admin (sekarang requireAdmin sudah terdefinisi dan aman)
app.get('/api/admin/bookings', requireAdmin, (req, res) => {
  const bookings = db.prepare(`
    SELECT id, name, email, booking_date, booking_time, notes, status, gcal_event_id, created_at 
    FROM bookings 
    ORDER BY created_at DESC
  `).all();
  res.json(bookings);
});

app.get('/api/admin/slots', requireAdmin, (req, res) => {
  const slots = db.prepare('SELECT * FROM available_slots ORDER BY slot_date ASC, slot_time ASC').all();
  res.json(slots);
});

// 1. ADMIN: Ambil semua slot yang dibuka
app.get('/api/admin/slots', (req, res) => {
  const slots = db.prepare('SELECT * FROM available_slots ORDER BY slot_date ASC, slot_time ASC').all();
  res.json(slots);
});

// 2. ADMIN: Tambah slot tanggal & jam
app.post('/api/admin/slots', (req, res) => {
  const { date, time } = req.body;
  if (!date || !time) return res.status(400).json({ error: 'Tanggal dan jam wajib diisi' });

  try {
    db.prepare('INSERT INTO available_slots (slot_date, slot_time) VALUES (?, ?)').run(date, time);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Slot pada tanggal dan jam tersebut sudah ada.' });
  }
});

// 3. ADMIN: Hapus slot
app.delete('/api/admin/slots/:id', (req, res) => {
  db.prepare('DELETE FROM available_slots WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 4. USER: Ambil tanggal yang aktif
app.get('/api/client/available-dates', (req, res) => {
  const dates = db.prepare(`
    SELECT DISTINCT slot_date 
    FROM available_slots 
    WHERE slot_date >= date('now')
    ORDER BY slot_date ASC
  `).all();
  res.json(dates.map(d => d.slot_date));
});

// 5. USER: Ambil jam tersedia (dikurangi yang sedang PENDING atau sudah APPROVED)
app.get('/api/client/slots', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Parameter date diperlukan' });

  const times = db.prepare(`
    SELECT s.slot_time 
    FROM available_slots s
    WHERE s.slot_date = ?
      AND s.slot_time NOT IN (
        SELECT b.booking_time 
        FROM bookings b 
        WHERE b.booking_date = ? AND b.status IN ('PENDING', 'APPROVED')
      )
    ORDER BY s.slot_time ASC
  `).all(date, date);

  res.json(times.map(t => t.slot_time));
});

// 6. USER: Submit Reservasi
app.post('/api/booking', async (req, res) => {
  const { name, email, booking_date, booking_time, notes } = req.body;
  if (!name || !email || !booking_date || !booking_time) {
    return res.status(400).json({ error: 'Mohon lengkapi seluruh formulir' });
  }

  const conflict = db.prepare(`
    SELECT id FROM bookings 
    WHERE booking_date = ? AND booking_time = ? AND status IN ('PENDING', 'APPROVED')
  `).get(booking_date, booking_time);

  if (conflict) {
    return res.status(409).json({ error: 'Slot baru saja dipesan. Silakan pilih jam lain.' });
  }

  const id = uuidv4();
  const token = uuidv4();

  db.prepare(`
    INSERT INTO bookings (id, name, email, booking_date, booking_time, notes, token, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(id, name, email, booking_date, booking_time, notes, token);

  const booking = { id, name, email, booking_date, booking_time, notes, token };
  await sendApprovalEmail(booking);

  res.json({ success: true, message: 'Permintaan terkirim. Menunggu persetujuan admin via email.' });
});

// 7. APPROVAL/REJECTION ENDPOINT (dari link email)
app.get('/api/booking/:id/action', async (req, res) => {
  const { id } = req.params;
  const { token, action } = req.query;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND token = ?').get(id, token);
  if (!booking) return res.status(404).send('<h3>Tautan tidak valid atau sudah hangus.</h3>');
  if (booking.status !== 'PENDING') {
    return res.send(`<h3>Jadwal ini sudah diproses dengan status: <strong>${booking.status}</strong></h3>`);
  }

  if (action === 'approve') {
    let eventId = null;
    try {
      if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN) {
        const cal = await insertCalendarEvent(booking);
        eventId = cal.id;
      }
    } catch (err) {
      console.error('Google Calendar error:', err.message);
    }

    db.prepare('UPDATE bookings SET status = ?, gcal_event_id = ? WHERE id = ?').run('APPROVED', eventId, id);
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2 style="color: #16a34a;">Jadwal Berhasil Disetujui!</h2>
        <p>Jadwal telah dikonfirmasi dan dicatat ke Google Calendar.</p>
      </div>
    `);
  } else if (action === 'reject') {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('REJECTED', id);
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 40px;">
        <h2 style="color: #dc2626;">Jadwal Telah Ditolak</h2>
        <p>Permintaan jadwal telah dibatalkan.</p>
      </div>
    `);
  }

  res.status(400).send('Aksi tidak valid.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend berjalan di http://localhost:${PORT}`));