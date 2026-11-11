const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

async function insertCalendarEvent(booking) {
  // Format waktu ISO (Durasi 60 menit, timezone Asia/Jakarta)
  const start = new Date(`${booking.booking_date}T${booking.booking_time}:00+07:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const res = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    conferenceDataVersion: 1,
    resource: {
      summary: `Konsultasi: ${booking.name}`,
      description: `Klien: ${booking.name}\nEmail: ${booking.email}\nCatatan: ${booking.notes || '-'}`,
      start: { dateTime: start.toISOString(), timeZone: 'Asia/Jakarta' },
      end: { dateTime: end.toISOString(), timeZone: 'Asia/Jakarta' },
      attendees: [{ email: booking.email }],
      conferenceData: {
        createRequest: { 
          requestId: booking.id, 
          conferenceSolutionKey: { type: 'hangoutsMeet' } 
        }
      }
    }
  });

  return res.data;
}

module.exports = { insertCalendarEvent };