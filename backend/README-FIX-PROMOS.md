# 🔧 Fix: ER_TOO_MANY_KEYS pada Tabel Promos

## ❌ Error yang Terjadi

```
SequelizeDatabaseError: Too many keys specified; max 64 keys allowed
sql: 'ALTER TABLE `promos` CHANGE `kode_promo` `kode_promo` VARCHAR(255) NOT NULL UNIQUE;'
```

## 🔍 Penyebab

Tabel `promos` memiliki terlalu banyak index (lebih dari 64). Ini terjadi karena:
- Sequelize `sync()` dipanggil berulang kali
- Setiap sync mencoba menambahkan index `UNIQUE` pada kolom `kode_promo`
- Index duplikat menumpuk hingga melebihi batas MySQL (64 keys)

## ✅ Solusi

### Opsi 1: Jalankan Script Node.js (Recommended)

```bash
cd backend
node fix-promos-indexes.js
```

Script ini akan:
1. Menampilkan semua index yang ada di tabel `promos`
2. Menghapus semua index kecuali `PRIMARY`
3. Membuat ulang index yang diperlukan:
   - `idx_kode_promo` (UNIQUE)
   - `idx_branch_id`
   - `idx_is_active`

### Opsi 2: Manual via MySQL

1. **Cek index yang ada:**
   ```sql
   SHOW INDEX FROM promos;
   ```

2. **Drop semua index kecuali PRIMARY:**
   ```sql
   -- Ganti 'nama_index' dengan nama index dari hasil SHOW INDEX
   ALTER TABLE promos DROP INDEX kode_promo;
   ALTER TABLE promos DROP INDEX kode_promo_2;
   ALTER TABLE promos DROP INDEX kode_promo_3;
   -- dst... hingga semua index non-PRIMARY terhapus
   ```

3. **Buat ulang index yang diperlukan:**
   ```sql
   ALTER TABLE promos ADD UNIQUE INDEX idx_kode_promo (kode_promo);
   ALTER TABLE promos ADD INDEX idx_branch_id (branch_id);
   ALTER TABLE promos ADD INDEX idx_is_active (is_active);
   ```

## 🛡️ Pencegahan

Untuk mencegah masalah ini terulang:

### 1. Gunakan `sync({ alter: true })` dengan hati-hati

Di `backend/models/index.js`, pastikan sync hanya dipanggil sekali saat development:

```javascript
// JANGAN seperti ini di production:
await sequelize.sync({ force: true }); // ❌ Drop semua tabel

// Gunakan ini untuk development:
await sequelize.sync({ alter: true }); // ⚠️ Hati-hati, bisa buat index duplikat

// Atau lebih baik, gunakan migrations:
// npm install --save-dev sequelize-cli
// npx sequelize-cli migration:generate --name create-promos-table
```

### 2. Gunakan Migrations (Recommended untuk Production)

```bash
# Install sequelize-cli
npm install --save-dev sequelize-cli

# Generate migration
npx sequelize-cli migration:generate --name fix-promos-indexes

# Edit file migration di migrations/
# Jalankan migration
npx sequelize-cli db:migrate
```

### 3. Disable `sync()` di Production

Di `backend/models/index.js`:

```javascript
if (process.env.NODE_ENV !== 'production') {
  await sequelize.sync({ alter: true });
} else {
  // Di production, gunakan migrations saja
  console.log('Production mode: skipping sync()');
}
```

## 📝 Catatan

- Setelah fix, restart backend server
- Backup database sebelum menjalankan script fix
- Jika masih error, cek apakah ada tabel lain yang juga punya terlalu banyak index

## 🆘 Jika Masih Error

1. **Backup database:**
   ```bash
   mysqldump -u root -p umkm_grow > backup.sql
   ```

2. **Drop dan recreate tabel promos:**
   ```sql
   DROP TABLE promos;
   ```

3. **Restart backend** (Sequelize akan membuat ulang tabel dengan index yang benar)

---

**Setelah fix berhasil, backend akan berjalan normal tanpa error `ER_TOO_MANY_KEYS`.**
