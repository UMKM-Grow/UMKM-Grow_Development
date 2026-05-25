# UMKM-Grow (Monorepo)

Repo ini berisi 2 aplikasi:
- **backend/**: REST API (Express + Sequelize + MySQL) untuk Auth, Katalog Produk, dan Absensi
- **frontend/**: Web app (React + Vite + Tailwind) untuk UI

## Fitur Utama

- **PBI-01**: Product Catalog (CRUD produk + varian, UI grid card + modal)
  - Dokumentasi: [afnan.md](file:///d:/projekan/UMKM-Grow/afnan.md)
- **PBI-13**: Auth + Absensi berbasis lokasi (GPS browser + riwayat)
  - Dokumentasi: [luthfi.md](file:///d:/projekan/UMKM-Grow/luthfi.md)

## Tech Stack

**Backend**
- Node.js (JavaScript)
- Express
- Sequelize + mysql2
- Auth JWT (jsonwebtoken)

**Frontend**
- React (Vite)
- TailwindCSS + PostCSS
- Axios
- React Router
- Lucide Icons

**Database**
- MySQL (mis. via XAMPP/Laragon/MySQL Service)

## Prasyarat (Environment)

- Git
- Node.js + npm (disarankan Node.js LTS)
- MySQL server jalan di lokal (disarankan MySQL 5.7 atau 8.0)

Port default:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

## Setup dari Awal (Git Clone → Run)

### 1) Clone Repo
```bash
git clone https://github.com/UMKM-Grow/UMKM-Grow_Development.git
cd UMKM-Grow
```

### 2) Install Dependency (Sekali Perintah)
Jalankan dari root:
```bash
npm run setup
```

Script ini otomatis menjalankan:
- `npm install` di `backend/`
- `npm install` di `frontend/`

### 3) Siapkan Database MySQL
Pastikan MySQL server sedang berjalan. Cara menjalankan MySQL tergantung pada cara instalasi:
- **Jika menggunakan XAMPP**: 
  - Buka XAMPP Control Panel
  - Klik "Start" di kolom Action untuk MySQL
- **Jika menggunakan Laragon**:
  - Buka Laragon
  - MySQL akan otomatis berjalan ketika Laragon started
  - Jika tidak, klik tombol "Start all" atau mulai MySQL dari menu
- **Jika menggunakan MySQL Service (Windows)**:
  - Buka Services (services.msc)
  - Cari layanan MySQL (biasanya bernama "MySQL80" atau serupa)
  - Klik kanan dan pilih "Start"

Buat database (contoh):
```sql
CREATE DATABASE umkm_grow;
```

Backend akan auto-sync tabel via Sequelize pada saat start (`sequelize.sync({ alter: true })`).

### 4) Konfigurasi Environment Variable Backend
File `.env` tidak ikut repo. Buat file `backend/.env` dari template berikut:

```env
PORT=5000

DB_HOST=127.0.0.1
DB_NAME=umkm_grow
DB_USER=root
DB_PASS=

JWT_SECRET=change_me_to_a_long_random_string
```

Catatan:
- Kalau `.env` tidak dibuat, backend akan memakai default di [database.js](file:///d:/projekan/UMKM-Grow/backend/config/database.js):
  - DB_NAME=`umkm_grow`, DB_USER=`root`, DB_PASS kosong, DB_HOST=`127.0.0.1`
- `JWT_SECRET` default fallback adalah `secret_key` (disarankan selalu di-set).

### 5) Jalankan Backend + Frontend Sekaligus
Jalankan dari root:
```bash
npm run dev
```

Atau:
```bash
npm start
```

Script `dev/start` akan menyalakan:
- Backend: `npm --prefix backend start`
- Frontend: `npm --prefix frontend run dev`

## Script Penting

**Root**
- `npm run setup` — install dependency backend + frontend
- `npm run dev` — jalanin backend+frontend bersamaan
- `npm start` — alias dari `npm run dev`

**Backend**
- `npm start` — start server (node)
- `npm run dev` — start dengan nodemon (kalau nodemon tersedia)

**Frontend**
- `npm run dev` — Vite dev server
- `npm run build` — build production
- `npm run preview` — preview build
- `npm run lint` — lint

## Menguji API (Opsional)

Anda dapat menggunakan alat seperti [Postman](https://www.postman.com/) atau `curl` untuk menguji endpoint auth.

Contoh registrasi pengguna baru dengan `curl`:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"User Demo","email":"demo@test.com","password":"Passw0rd!","role":"kasir"}'
```

Contoh login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"Passw0rd!"}'
```

Respons login akan mengembalikan token JWT yang dapat digunakan untuk mengakses endpoint yang terproteksi.

## Cara Login (Auth)

Endpoint Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`

Contoh register (JSON):
```json
{
  "name": "User Demo",
  "email": "demo@test.com",
  "password": "Passw0rd!",
  "role": "kasir"
}
```

Token yang didapat dari login disimpan di browser (localStorage) dan dipakai untuk akses route yang protected (mis. absensi).

## Production Build

**Frontend**
Untuk membangun frontend untuk produksi:
```bash
# Dari direktori root
npm --prefix frontend run build
```
Hasil build akan berada di `frontend/dist`. Anda dapat menggunakan server web seperti Nginx atau Apache untuk menyajikan file-file tersebut.

**Backend**
Backend dapat dijalankan dengan process manager seperti PM2 untuk produksi:
```bash
# Install PM2 secara global (jika belum)
npm install -g pm2
# Jalankan backend dengan PM2
pm2 start backend/index.js --name umkm-grow-backend
```

## Variabel Lingkungan untuk Frontend

Untuk development, frontend tidak membutuhkan variabel lingkungan khusus karena mengandalkan proxy ke backend saat development (atau Anda dapat mengatur base URL dalam kode).

Untuk production, Anda mungkin perlu mengatur variabel lingkungan untuk base URL API jika frontend dan backend berada di domain berbeda. Namun, dalam konfigurasi saat ini, frontend berkomunikasi dengan backend melalui relative URL karena mereka di-host dari same origin ketika di-build dan dijalankan bersama.

Jika Anda memisahkan host frontend dan backend, Anda dapat mengubah kode frontend untuk menggunakan base URL dari variabel lingkungan. Saat ini, tidak ada variabel lingkungan yang dikonfigurasi untuk frontend.

## Troubleshooting

- **401 Unauthorized saat absensi**: pastikan sudah login dan token tersimpan.
- **400 Latitude/Longitude required**: pastikan browser mengizinkan lokasi dan status GPS sudah “Lokasi Akurat”.
- **DB gagal connect**: pastikan MySQL sudah jalan dan kredensial di `backend/.env` sesuai.
- **Port sudah digunakan**: pastikan tidak ada aplikasi lain yang menggunakan port 5000 (backend) atau 5173 (frontend). Anda dapat mengubah port di `backend/.env` (PORT) dan di `frontend/vite.config.js` (jika diperlukan).
- **Modul tidak ditemukan setelah clone**: pastikan Anda sudah menjalankan `npm setup` dari root directory untuk menginstall dependensi di backend dan frontend.
- **Error saat build frontend**: pastikan Anda memiliki versi Node yang kompatibel dengan Vite (disarankan Node.js LTS).