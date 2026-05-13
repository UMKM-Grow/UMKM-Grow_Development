# PBI-13 (Luthfi) — Auth + Absensi Berbasis Lokasi (Full Scope)

Dokumen ini merangkum scope kerja **Luthfi** untuk penyelesaian **PBI-13** pada branch `luthfi`, dengan fokus utama: **Auth (Register/Login JWT)** dan **Absensi berbasis lokasi** (GPS browser + pencatatan koordinat + riwayat).

## Ringkasan Fitur (PBI-13)

**Tujuan PBI-13**
- User bisa **Register** dan **Login** (JWT).
- User bisa **CHECK IN / CHECK OUT** memakai koordinat dari browser.
- Sistem menyimpan absensi per user dan menampilkan **riwayat absensi milik user yang sedang login**.
- UI halaman absensi tetap satu tema: **dark / tech-wear + glassmorphism**.

**Catatan lokasi**
- Implementasi saat ini menganggap **lokasi user = lokasi toko** (supaya tidak gagal saat check-in/out karena perbedaan radius). Koordinat tetap tersimpan untuk kebutuhan audit/riwayat.

## Cara Menjalankan (Dev)

### Backend
```bash
cd backend
npm install
npm start
```

Backend berjalan di `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

## Backend (Apa yang Dibuat untuk PBI-13)

### 1) Model Attendance + Relasi ke User
- File: `backend/models/Attendance.js`
- Field utama:
  - `user_id` (FK ke Users)
  - `action` (ENUM: `CHECK_IN` / `CHECK_OUT`)
  - `latitude`, `longitude`
  - `timestamp`
- Relasi:
  - `User.hasMany(Attendance, { as: 'attendances' })`
  - `Attendance.belongsTo(User, { as: 'user' })`
- Lokasi relasi: `backend/models/index.js`

### 2) Endpoint Attendance + Proteksi JWT
- Routes: `backend/routes/attendanceRoutes.js`
  - `POST /api/attendance` (CHECK IN / CHECK OUT)
  - `GET /api/attendance/my-history` (riwayat absensi user login)
- Controller: `backend/controllers/attendanceController.js`
  - Validasi:
    - `action` harus `CHECK_IN` atau `CHECK_OUT`
    - `latitude` & `longitude` wajib ada
  - `user_id` diambil dari JWT (`req.user.id`)
- Auth middleware:
  - `verifyToken` dipakai di semua route attendance (`backend/middlewares/authMiddleware.js`)

### 3) Auth (Register/Login) JWT
- Routes: `backend/routes/authRoutes.js`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Controller: `backend/controllers/authController.js`
  - Register: create user + return token
  - Login: validasi email/password + return token

## Frontend (Apa yang Dibuat untuk PBI-13)

### 1) Halaman Absensi (GPS + Check In/Out + History)
- File: `frontend/src/Absensi.jsx`

Fitur halaman:
- Ambil koordinat dengan `navigator.geolocation.getCurrentPosition(...)`
- Menampilkan indikator status:
  - “Lokasi Akurat” (hijau)
  - “Izinkan akses lokasi browser Anda!” (merah) jika permission ditolak
- Tombol besar:
  - **CHECK IN** (brand-ice)
  - **CHECK OUT** (border / transparan)
- Fetch riwayat:
  - `GET /api/attendance/my-history`
  - Ditampilkan dalam bentuk **grid card** (bukan tabel jadul)

### 2) Nama Lokasi dari Koordinat (Reverse Geocoding)
- Di halaman absensi, selain koordinat juga ditampilkan **daerah/kota, provinsi, negara**.
- Sumber reverse geocoding tanpa API key:
  - `https://api.bigdatacloud.net/data/reverse-geocode-client`

### 3) Routing Halaman
- Route ditambahkan di: `frontend/src/App.jsx`
  - `/login`
  - `/absensi`

## Payload API (Kontrak Data yang Dipakai UI)

### Create Attendance (POST /api/attendance)
```json
{
  "action": "CHECK_IN",
  "latitude": -6.200000,
  "longitude": 106.816666
}
```

Headers:
```
Authorization: Bearer <JWT_TOKEN>
```

### My History (GET /api/attendance/my-history)
Headers:
```
Authorization: Bearer <JWT_TOKEN>
```

## File yang Relevan untuk PBI-13

**Backend**
- `backend/models/Attendance.js`
- `backend/models/index.js`
- `backend/controllers/attendanceController.js`
- `backend/routes/attendanceRoutes.js`
- `backend/controllers/authController.js`
- `backend/routes/authRoutes.js`
- `backend/middlewares/authMiddleware.js`
- `backend/index.js`

**Frontend**
- `frontend/src/Absensi.jsx`
- `frontend/src/App.jsx`
