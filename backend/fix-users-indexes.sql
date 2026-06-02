-- =====================================================
-- FIX: Too many keys specified (ER_TOO_MANY_KEYS)
-- Problem: Tabel users memiliki terlalu banyak index (>64)
-- Solution: Drop duplicate indexes dan buat ulang yang perlu
-- =====================================================

USE umkm_grow;

-- Step 1: Lihat semua indexes di tabel users
SHOW INDEXES FROM users;

-- Step 2: Drop semua indexes KECUALI PRIMARY KEY
-- (Ini akan menghapus duplicate indexes yang menyebabkan error)

SET @table_name = 'users';
SET @drop_indexes = NULL;

SELECT GROUP_CONCAT(DISTINCT CONCAT('DROP INDEX `', index_name, '` ON `', table_name, '`') SEPARATOR '; ')
INTO @drop_indexes
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name = 'users'
  AND index_name != 'PRIMARY';

-- Tampilkan query yang akan dijalankan
SELECT @drop_indexes;

-- Jalankan drop indexes (uncomment baris di bawah setelah cek)
-- PREPARE stmt FROM @drop_indexes;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- Step 3: Atau manual drop indexes yang duplikat
-- Contoh jika ada index email_2, email_3, dst:
-- DROP INDEX IF EXISTS `email_2` ON `users`;
-- DROP INDEX IF EXISTS `email_3` ON `users`;
-- DROP INDEX IF EXISTS `email_4` ON `users`;
-- ... dst sampai email_64

-- Step 4: Buat ulang index yang benar-benar diperlukan
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);
CREATE INDEX IF NOT EXISTS `users_branch_id` ON `users` (`branch_id`);
CREATE INDEX IF NOT EXISTS `users_is_active` ON `users` (`is_active`);
CREATE INDEX IF NOT EXISTS `users_role` ON `users` (`role`);

-- Step 5: Verifikasi index yang tersisa
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    NON_UNIQUE,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'users'
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
ORDER BY TABLE_NAME, INDEX_NAME;

-- Expected result: Hanya 5 indexes
-- 1. PRIMARY (id)
-- 2. users_email_unique (email) - UNIQUE
-- 3. users_branch_id (branch_id)
-- 4. users_is_active (is_active)
-- 5. users_role (role)
