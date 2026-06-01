-- Fix: Too many keys in promos table
-- Jalankan query ini di MySQL untuk membersihkan index duplikat

-- 1. Lihat semua index yang ada di tabel promos
SHOW INDEX FROM promos;

-- 2. Drop semua index kecuali PRIMARY KEY
-- (Sesuaikan nama index berdasarkan hasil SHOW INDEX)
-- Contoh:
-- ALTER TABLE promos DROP INDEX kode_promo;
-- ALTER TABLE promos DROP INDEX kode_promo_2;
-- ALTER TABLE promos DROP INDEX kode_promo_3;
-- dst...

-- 3. Buat ulang index yang diperlukan
ALTER TABLE promos ADD UNIQUE INDEX idx_kode_promo (kode_promo);
ALTER TABLE promos ADD INDEX idx_branch_id (branch_id);
ALTER TABLE promos ADD INDEX idx_is_active (is_active);
