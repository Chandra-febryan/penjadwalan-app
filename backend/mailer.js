const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

async function initMailer() {
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  console.log('[Mailer] Ethereal siap. Akun uji coba:', testAccount.user);
}

initMailer();

async function sendApprovalEmail(booking) {
  const approveUrl = `${process.env.BASE_URL}/api/booking/${booking.id}/action?token=${booking.token}&action=approve`;
  const rejectUrl = `${process.env.BASE_URL}/api/booking/${booking.id}/action?token=${booking.token}&action=reject`;

  const info = await transporter.sendMail({
    from: '"Sistem Penjadwalan" <no-reply@schedule.local>',
    to: 'admin@schedule.local',
    subject: `[Reservasi Baru] ${booking.name} - ${booking.booking_date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; margin-top: 0;">Pengajuan Jadwal Baru</h2>
        <p><strong>Nama:</strong> ${booking.name}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Tanggal:</strong> ${booking.booking_date}</p>
        <p><strong>Waktu:</strong> ${booking.booking_time} WIB</p>
        <p><strong>Catatan:</strong> ${booking.notes || '-'}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;" />
        <div style="display: flex; gap: 10px;">
          <a href="${approveUrl}" style="background-color: #16a34a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Setujui</a>
          <a href="${rejectUrl}" style="background-color: #dc2626; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-left: 10px;">Tolak</a>
        </div>
      </div>
    `
  });

  console.log('\n================== EMAIL APPROVAL DIKIRIM ==================');
  console.log('Klik tautan ini untuk melihat email di browser:');
  console.log(nodemailer.getTestMessageUrl(info));
  console.log('============================================================\n');
}

module.exports = { sendApprovalEmail };