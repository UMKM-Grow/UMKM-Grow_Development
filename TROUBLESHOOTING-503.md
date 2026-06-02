# 🔧 Troubleshooting Error 503 - UMKM-Grow

## ❌ Error yang Terjadi

Anda mengalami error **503 (Service Unavailable)** pada beberapa endpoint:
- `GET /api/customers` → 503
- `GET /api/analytics/best-seller?branch_id=4` → 503

Error ini menunjukkan bahwa **backend server tidak merespons** atau **ada masalah di sisi server**.

---

## 🔍 Diagnosa Masalah

### 1. **Backend Server Tidak Berjalan**
Backend Node.js harus berjalan di port 5000 untuk melayani request dari frontend.

### 2. **Database Connection Error**
Server mungkin tidak bisa terhubung ke database MySQL.

### 3. **Endpoint Memerlukan Autentikasi**
Beberapa endpoint memerlukan token JWT yang valid:
- `/api/customers` → Memerlukan `verifyToken`
- `/api/analytics` → Memerlukan `verifyToken`

### 4. **Branch ID Tidak Valid**
API analytics memerlukan `branch_id` yang valid di database.

---

## ✅ Solusi Step-by-Step

### **STEP 1: Periksa Backend Server Berjalan**

#### Cara 1: Manual Check
```bash
# Di terminal, pindah ke folder backend
cd d:\projekan\UMKM-Grow\backend

# Jalankan backend server
npm run dev
# atau
npm start
```

#### Cara 2: Periksa Process
```bash
# Windows CMD
netstat -ano | findstr :5000

# PowerShell
Get-NetTCPConnection -LocalPort 5000
```

Jika tidak ada output, **backend TIDAK berjalan** → Lanjut ke Step 2.

---

### **STEP 2: Start Backend Server**

```bash
# Di terminal baru, masuk ke folder backend
cd d:\projekan\UMKM-Grow\backend

# Install dependencies (jika belum)
npm install

# Jalankan backend
npm run dev
```

**Output yang benar:**
```
Server is running on port 5000
Sequelize: Database connected successfully
```

---

### **STEP 3: Periksa File .env**

Backend memerlukan file `.env` dengan konfigurasi database:

```bash
# Copy dari example
cp .env.example .env
```

**Edit file `.env`:**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=umkm_grow
JWT_SECRET=your_secret_key
```

---

### **STEP 4: Periksa Database Connection**

```bash
# Test koneksi database
mysql -u root -p

# Di MySQL prompt
USE umkm_grow;
SHOW TABLES;

# Periksa apakah ada data di tabel cabang
SELECT * FROM cabang;
```

Jika tabel `cabang` kosong atau `branch_id=4` tidak ada → Lanjut ke Step 5.

---

### **STEP 5: Seed Data (Isi Data Awal)**

```bash
# Di folder backend
cd d:\projekan\UMKM-Grow\backend

# Jalankan seed data
node seedData.js
```

Ini akan membuat:
- User admin
- Beberapa cabang
- Produk sample
- Data awal lainnya

---

### **STEP 6: Periksa Authentication Token**

Frontend mengirim token JWT di header `Authorization: Bearer <token>`.

**Di browser console (F12):**
```javascript
// Periksa token tersimpan
localStorage.getItem('token')

// Jika null atau expired, login ulang
localStorage.removeItem('token')
localStorage.removeItem('user')
window.location.href = '/login'
```

---

### **STEP 7: Test API Langsung**

Gunakan **Postman** atau **curl** untuk test API:

```bash
# Test GET customers (dengan token)
curl -X GET http://localhost:5000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test GET analytics best-seller
curl -X GET "http://localhost:5000/api/analytics/best-seller?branch_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 Troubleshooting Branch ID

### **Masalah:** `branch_id=4` tidak ada di database

**Solusi:**
```sql
-- Di MySQL
SELECT * FROM cabang;

-- Jika hanya ada branch_id 1,2,3 → gunakan salah satu yang ada
-- Atau tambah cabang baru
INSERT INTO cabang (nama_cabang, lokasi) VALUES 
  ('Cabang Baru', 'Jl. Contoh No. 1');
```

**Di Frontend (BranchContext):**
- Pilih cabang yang tersedia di dropdown
- Jangan hardcode `branch_id=4` jika tidak ada

---

## 🔄 Verifikasi Backend Berjalan Dengan Benar

### Test Root Endpoint:
```bash
curl http://localhost:5000/
```

**Expected Output:**
```
UMKM-Grow API is running...
```

### Test Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

**Expected Output:**
```json
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "name": "Admin", ... }
}
```

---

## 🚀 Recommended Workflow

### **Untuk Development:**

1. **Terminal 1 (Backend):**
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2 (Frontend):**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Browser:**
   - Buka `http://localhost:5173` (atau port Vite Anda)
   - Login dengan user yang sudah ada
   - Pilih cabang dari dropdown

---

## 🔑 Akun Default (Setelah Seed)

Jika Anda menjalankan `seedData.js`:

```
Email: admin@test.com
Password: password123
```

---

## ❓ FAQ

### Q: "Backend berjalan tapi masih error 503?"
**A:** Periksa console backend untuk error message. Kemungkinan:
- Database connection failed
- Port 5000 bentrok dengan aplikasi lain

### Q: "Bagaimana cara restart backend?"
**A:** 
```bash
# Ctrl + C untuk stop
# Kemudian jalankan lagi:
npm run dev
```

### Q: "Bisa pindah branch atau tidak?"
**A:** **BISA!** Selama:
1. Backend berjalan
2. Token valid
3. Branch ID ada di database
4. User punya akses ke branch tersebut (jika ada role-based access)

### Q: "Error 401 Unauthorized?"
**A:** Token expired atau invalid → Login ulang

### Q: "Error 404 Not Found?"
**A:** Endpoint atau route tidak ada → Periksa URL dan routing

---

## 📝 Checklist Sebelum Development

- [ ] Backend server berjalan (`npm run dev`)
- [ ] Database MySQL aktif
- [ ] File `.env` sudah dikonfigurasi
- [ ] Seed data sudah dijalankan
- [ ] Token authentication valid
- [ ] Branch ID yang digunakan ada di database

---

## 💡 Tips

1. **Gunakan `nodemon`** untuk auto-restart backend saat development:
   ```bash
   npm run dev  # sudah menggunakan nodemon
   ```

2. **Monitor Backend Logs** untuk melihat error real-time

3. **Gunakan Browser DevTools (F12) → Network Tab** untuk melihat request/response

4. **Test API dengan Postman** sebelum test di frontend

---

Jika masih ada error, share:
- Backend console output
- Browser console error
- Network tab request/response details
