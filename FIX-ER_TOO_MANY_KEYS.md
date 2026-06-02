# 🔧 Fix Error: ER_TOO_MANY_KEYS (Too many keys specified; max 64 keys allowed)

## ❌ Problem

Backend menampilkan error:
```
SequelizeDatabaseError: Too many keys specified; max 64 keys allowed
sql: 'ALTER TABLE `users` CHANGE `email` `email` VARCHAR(255) NOT NULL UNIQUE;'
```

**Root Cause:**
- Tabel `users` di database memiliki **lebih dari 64 indexes**
- Ini terjadi karena `sequelize.sync({ alter: true })` terus mencoba menambahkan index `UNIQUE` untuk kolom `email` setiap kali backend restart
- MySQL memiliki limit maksimal **64 indexes per tabel**

---

## ✅ Solution (3 Cara)

### **CARA 1: Automatic Fix dengan Script (RECOMMENDED)** ⭐

Ini adalah cara paling mudah dan aman:

```bash
# Di terminal, masuk ke folder backend
cd d:\projekan\UMKM-Grow\backend

# Jalankan script fix
node fix-users-indexes.js
```

**Output yang diharapkan:**
```
🚀 Starting users table indexes fix...
✅ Connected to database: umkm_grow
📋 Found 150 index entries
🗑️  Dropping all indexes except PRIMARY...
  ✅ Dropped index: email
  ✅ Dropped index: email_2
  ... (banyak lagi)
🔨 Creating necessary indexes...
  ✅ Created: users_email_unique (Unique index on email)
  ✅ Created: users_branch_id (Index on branch_id for joins)
  ✅ Created: users_is_active (Index on is_active for filtering)
  ✅ Created: users_role (Index on role for filtering)
✅ Total indexes: 5
🎉 SUCCESS! Indexes fixed successfully!
```

**Setelah itu:**
```bash
# Restart backend
npm start
```

---

### **CARA 2: Manual SQL Query**

Jika Anda prefer manual:

```bash
# Login ke MySQL
mysql -u root -p

# Pilih database
USE umkm_grow;

# 1. Lihat semua indexes
SHOW INDEXES FROM users;
```

Anda akan melihat **banyak sekali index dengan nama duplikat** seperti:
- `email`, `email_2`, `email_3`, ..., `email_64`, ...
- `branch_id`, `branch_id_2`, ...
- dst.

**Drop semua indexes kecuali PRIMARY:**

```sql
-- Drop indexes secara manual
-- Sesuaikan dengan nama index yang Anda lihat
DROP INDEX email ON users;
DROP INDEX email_2 ON users;
DROP INDEX email_3 ON users;
-- ... lanjutkan sampai semua index terhapus kecuali PRIMARY

-- Atau gunakan script prepared statement
SET @table_name = 'users';

SELECT GROUP_CONCAT(
    DISTINCT CONCAT('DROP INDEX `', index_name, '` ON `', table_name, '`;')
    SEPARATOR ' '
)
INTO @drop_indexes
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name = 'users'
  AND index_name != 'PRIMARY';

-- Tampilkan query
SELECT @drop_indexes;

-- Copy paste output dan jalankan manual
-- Atau uncomment 3 baris di bawah untuk auto execute:
-- PREPARE stmt FROM @drop_indexes;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;
```

**Buat ulang index yang perlu:**

```sql
-- Create necessary indexes
CREATE UNIQUE INDEX users_email_unique ON users (email);
CREATE INDEX users_branch_id ON users (branch_id);
CREATE INDEX users_is_active ON users (is_active);
CREATE INDEX users_role ON users (role);
```

**Verifikasi:**

```sql
-- Cek total indexes
SELECT COUNT(DISTINCT INDEX_NAME) as total_indexes
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users';

-- Expected: 5 (PRIMARY + 4 custom indexes)
```

---

### **CARA 3: Drop dan Recreate Tabel (LAST RESORT)** ⚠️

**WARNING:** Ini akan **menghapus semua data users**! Backup dulu!

```sql
-- Backup data users
CREATE TABLE users_backup AS SELECT * FROM users;

-- Drop tabel users
DROP TABLE users;

-- Restart backend untuk recreate tabel otomatis
-- Kemudian restore data jika perlu
```

---

## 🛡️ Prevention (Mencegah Error Ini Terjadi Lagi)

### **Fix 1: Ubah Sequelize Sync Mode**

File: `backend/models/index.js`

**SEBELUM (❌ Menyebabkan masalah):**
```javascript
await sequelize.sync({ alter: true });
```

**SESUDAH (✅ Aman):**
```javascript
await sequelize.sync({ force: false });
```

**Penjelasan:**
- `alter: true` → Sequelize akan terus mencoba ALTER TABLE setiap restart, menambahkan index duplikat
- `force: false` → Sequelize hanya sync jika tabel belum ada (tidak alter existing tables)

✅ **Sudah diperbaiki di commit ini!**

### **Fix 2: Gunakan Migrations untuk Production**

Untuk production, **jangan gunakan `sequelize.sync()`**. Gunakan migrations:

```bash
# Install sequelize-cli
npm install --save-dev sequelize-cli

# Generate migration
npx sequelize-cli migration:generate --name fix-users-indexes

# Edit file migration yang dibuat
# Tambahkan logic untuk manage indexes

# Run migration
npx sequelize-cli db:migrate
```

---

## 📊 Verify Everything Works

Setelah fix:

### 1. Check Indexes
```sql
SHOW INDEXES FROM users;
```

Expected output:
```
Table: users
Key_name          | Column_name | Non_unique
------------------+-------------+-----------
PRIMARY           | id          | 0
users_email_unique| email       | 0
users_branch_id   | branch_id   | 1
users_is_active   | is_active   | 1
users_role        | role        | 1
```

Total: **5 indexes** (jauh di bawah limit 64)

### 2. Restart Backend
```bash
cd backend
npm start
```

Expected output (NO ERROR):
```
Connection to database has been established successfully.
Database models synchronized.
Server is running on port 5000
```

### 3. Test API
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kasir@example.com","password":"password123"}'
```

---

## 🔍 Troubleshooting

### "Access denied for user"
**Problem:** Script tidak bisa connect ke database

**Fix:**
```bash
# Edit .env dengan credentials yang benar
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=umkm_grow
```

### "Database doesn't exist"
**Problem:** Database belum dibuat

**Fix:**
```sql
CREATE DATABASE umkm_grow;
```

### "Still getting ER_TOO_MANY_KEYS after fix"
**Problem:** Indexes belum terhapus semua

**Fix:**
```bash
# Jalankan script lagi
node fix-users-indexes.js

# Atau manual check di MySQL
mysql -u root -p
USE umkm_grow;
SHOW INDEXES FROM users;
# Jika masih > 10 indexes, drop manual satu-satu
```

---

## 📝 Checklist

Fix Error:
- [ ] Jalankan `node fix-users-indexes.js`
- [ ] Verify indexes ≤ 10 dengan `SHOW INDEXES FROM users;`
- [ ] Update `models/index.js` (sudah otomatis di repo ini)
- [ ] Restart backend `npm start`
- [ ] Check console: NO error ER_TOO_MANY_KEYS
- [ ] Test API login berhasil

Prevention:
- [ ] `sequelize.sync({ force: false })` sudah diset
- [ ] Setup migrations untuk production (optional)
- [ ] Dokumentasi untuk developer lain

---

## 💡 Why This Happens?

Setiap kali backend restart dengan `sequelize.sync({ alter: true })`:

1. Sequelize check schema differences
2. Sequelize sees `email: { unique: true }` in model
3. Sequelize tries to: `ALTER TABLE users ADD UNIQUE INDEX email`
4. MySQL creates index dengan nama: `email`, `email_2`, `email_3`, ...
5. Setelah 64 kali restart → **ERROR: Too many keys**

**Solution:** Gunakan `sync({ force: false })` atau migrations.

---

## 📚 References

- [MySQL Index Limit](https://dev.mysql.com/doc/refman/8.0/en/innodb-limits.html)
- [Sequelize Sync Options](https://sequelize.org/docs/v6/core-concepts/model-basics/#model-synchronization)
- [Sequelize Migrations](https://sequelize.org/docs/v6/other-topics/migrations/)

---

✅ **Problem Solved!** Backend sekarang bisa jalan tanpa error ER_TOO_MANY_KEYS.
