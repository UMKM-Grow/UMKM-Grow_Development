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
- JWT Auth (jsonwebtoken)

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
- MySQL server jalan di lokal

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

## Troubleshooting

- **401 Unauthorized saat absensi**: pastikan sudah login dan token tersimpan.
- **400 Latitude/Longitude required**: pastikan browser mengizinkan lokasi dan status GPS sudah “Lokasi Akurat”.
- **DB gagal connect**: pastikan MySQL sudah jalan dan kredensial di `backend/.env` sesuai.
