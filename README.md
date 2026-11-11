# Jadwal-App (Sistem Penjadwalan yang Terhubung dengan Google Kalender)

Sistem pemesanan jadwal temu dan konsultasi berbasis web yang dirancang dengan pendekatan Mobile-First. Aplikasi ini mengintegrasikan sesi meeting berdasarkan waktu yang dapat dikustom oleh admin, sinkronisasi otomatis ke Google Calendar API, serta mekanisme persetujuan melalui email.

---

## Fitur Utama version 1.0

### Sisi Pengguna (Client)
- **Tampilan Ramah Layar Ponsel:** Navigasi tanggal berbasis geser horizontal (*horizontal scrollable cards*) dan pemilihan waktu menggunakan tombol sentuh.
- **Slot Waktu Dinamis:** Hanya menampilkan tanggal dan jam yang secara eksplisit dibuka oleh admin dan belum dibooking orang lain.
- **Formulir Terintegrasi:** Validasi data pemesan (nama, email aktif, dan catatan konsultasi) sebelum diajukan.

### Sisi Admin (Pemilik Kalender)
- **Terproteksi Sandi/PIN:** Dilengkapi otentikasi header (`x-admin-key`) untuk mencegah akses publik ke pengelolaan slot.
- **Manajemen Ketersediaan Fleksibel:** Kemampuan menentukan hari dan jam tertentu yang siap melayani konsultasi, serta menghapus slot kapan saja.
- **Approval 1-Klik via Email:** Admin menerima notifikasi email transaksi untuk setiap pengajuan baru dengan tautan instan `[Setujui]` atau `[Tolak]`.
- **Integrasi Otomatis Google Calendar:** Jadwal yang disetujui otomatis masuk ke Google Calendar lengkap dengan tautan **Google Meet**.
- **Log Booking Terperinci:** Dashboard monitoring untuk memantau status pemesanan (`PENDING`, `APPROVED`, `REJECTED`) beserta identitas pemesan.

---

##  Tech Stack

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Frontend** | Vue 3 (Composition API) | Framework reaktif modern |
| **Tooling & Build** | Vite | Dev server berkecepatan tinggi dengan integrasi LAN |
| **Styling** | Tailwind CSS v3 | Framework utilitas CSS untuk layout mobile-first |
| **Routing** | Vue Router 4 | Manajemen rute pemisahan halaman User & Admin |
| **Backend Runtime** | Node.js | Server environment |
| **Framework Backend** | Express.js | REST API & web service |
| **Database** | SQLite (`better-sqlite3`) | Penyimpanan lokal cepat dan serverless |
| **Email Service** | Nodemailer + Ethereal | Pengujian pengiriman email transaksi lokal |
| **Kalender API** | `googleapis` (v3) | Integrasi akun Google Calendar via OAuth 2.0 |

---

##  Struktur Proyek

```text
jadwal-app/
├── backend/
│   ├── .env.example          # Template konfigurasi environment
│   ├── calendar.js           # Handler Google Calendar API & Meet
│   ├── db.js                 # Skema & inisialisasi SQLite
│   ├── mailer.js             # Handler notifikasi email approval
│   ├── server.js             # REST API & Middleware proteksi
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminSlots.vue   # Komponen panel admin & log
│   │   │   └── UserBooking.vue  # Komponen reservasi klien
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── router.js         # Pengaturan URL router
│   │   └── style.css
│   ├── vite.config.js        # Konfigurasi proxy & LAN host
│   └── package.json
├── .gitignore
└── README.md