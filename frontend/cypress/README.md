# 🧪 Cypress E2E Testing - UMKM-Grow

Dokumentasi lengkap untuk automated testing menggunakan Cypress.

---

## 📋 Daftar Test Suite

### 1. **login.cy.js** - Autentikasi Login
7 skenario pengujian:
- ✅ Tampilan halaman login
- ✅ Login berhasil → redirect ke Dashboard
- ✅ Login gagal dengan kredensial salah
- ✅ Validasi form kosong
- ✅ Proteksi rute tanpa autentikasi
- ✅ Loading state tombol
- ✅ Token tersimpan di localStorage

### 2. **dashboard.cy.js** - Fitur Dashboard
16 skenario pengujian:
- ✅ Tampilan halaman Dashboard
- ✅ Verifikasi 14 menu fitur
- ✅ Navigasi ke POS, Inventory, Settings
- ✅ Widget Low Stock Alert (4 state: pilih cabang, loading, data kosong, data ada)
- ✅ Widget Best Seller (4 state: pilih cabang, loading, data kosong, data ada)
- ✅ Hover effect menu cards
- ✅ Navigasi kembali ke Dashboard
- ✅ Error handling API gagal

---

## 🚀 Cara Menjalankan Test

### Prasyarat
Pastikan **backend** dan **frontend** sudah berjalan:

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Mode Visual (Recommended untuk Development)
```bash
cd frontend
npm run cy:open
```
Pilih browser → klik file test yang ingin dijalankan.

### Mode Headless (Terminal)
```bash
# Jalankan semua test
npm run cy:run

# Jalankan test login saja
npm run cy:run:login

# Jalankan test dashboard saja
npm run cy:run:dashboard

# Jalankan test POS saja
npm run cy:run:pos
```

---

## 🔧 Custom Commands

File: `cypress/support/commands.js`

### `cy.login(email, password)`
Login via UI (mengisi form dan klik tombol).

**Contoh:**
```javascript
cy.login('owner@umkmgrow.com', 'rahasia123');
```

### `cy.loginByApi(email, password)`
Login langsung via API (lebih cepat, tanpa render UI).

**Contoh:**
```javascript
beforeEach(() => {
  cy.loginByApi('owner@umkmgrow.com', 'rahasia123');
  cy.visit('/dashboard');
});
```

---

## 📦 Fixtures

File: `cypress/fixtures/user.json`

Data kredensial untuk testing:
```json
{
  "validUser": {
    "email": "owner@umkmgrow.com",
    "password": "rahasia123"
  },
  "invalidUser": {
    "email": "salah@email.com",
    "password": "passwordsalah"
  }
}
```

**Update kredensial ini sesuai dengan data di database Anda.**

---

## 🐛 Troubleshooting

### Test gagal karena kredensial salah
Update `cypress/fixtures/user.json` dengan kredensial yang valid di database.

### Test gagal karena backend tidak berjalan
Pastikan backend aktif di `http://localhost:5000` sebelum menjalankan test.

### Test gagal karena port frontend berbeda
Update `baseUrl` di `cypress.config.js` sesuai port Vite Anda.

### Screenshot otomatis saat test gagal
Cypress otomatis menyimpan screenshot di folder `cypress/screenshots/` saat test gagal.

---

## 📸 Video Recording

Saat menjalankan `npm run cy:run`, Cypress otomatis merekam video test di folder `cypress/videos/`.

Untuk disable video recording, tambahkan di `cypress.config.js`:
```javascript
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    video: false, // Disable video recording
  },
});
```

---

## 🎯 Best Practices

1. **Gunakan `cy.loginByApi()` untuk test non-login**
   - Lebih cepat karena skip render UI login
   - Fokus test pada fitur yang diuji, bukan login

2. **Mock API untuk test widget**
   - Gunakan `cy.intercept()` untuk kontrol data API
   - Test semua state: loading, error, data kosong, data ada

3. **Selector yang stabil**
   - Gunakan `data-cy` attribute untuk selector yang tidak berubah
   - Hindari selector berdasarkan class CSS yang bisa berubah

4. **Isolasi test**
   - Setiap test harus independen
   - Gunakan `beforeEach()` untuk reset state

---

## 📚 Referensi

- [Cypress Documentation](https://docs.cypress.io/)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [API Commands](https://docs.cypress.io/api/table-of-contents)
