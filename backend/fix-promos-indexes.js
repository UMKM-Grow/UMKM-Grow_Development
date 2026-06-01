/**
 * Script untuk fix error: ER_TOO_MANY_KEYS pada tabel promos
 * Menghapus semua index duplikat dan membuat ulang yang diperlukan
 */

const sequelize = require('./config/database');

async function fixPromosIndexes() {
  try {
    console.log('🔧 Memperbaiki index tabel promos...');

    // 1. Cek index yang ada
    const [indexes] = await sequelize.query(`
      SELECT DISTINCT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'promos' 
        AND INDEX_NAME != 'PRIMARY'
    `);

    console.log(`📋 Ditemukan ${indexes.length} index (selain PRIMARY):`);
    indexes.forEach(idx => console.log(`   - ${idx.INDEX_NAME}`));

    // 2. Drop semua index kecuali PRIMARY
    for (const idx of indexes) {
      try {
        await sequelize.query(`ALTER TABLE promos DROP INDEX \`${idx.INDEX_NAME}\``);
        console.log(`✅ Berhasil drop index: ${idx.INDEX_NAME}`);
      } catch (err) {
        console.log(`⚠️  Gagal drop index ${idx.INDEX_NAME}: ${err.message}`);
      }
    }

    // 3. Buat ulang index yang diperlukan
    console.log('\n🔨 Membuat ulang index yang diperlukan...');

    try {
      await sequelize.query(`
        ALTER TABLE promos 
        ADD UNIQUE INDEX idx_kode_promo (kode_promo)
      `);
      console.log('✅ Index idx_kode_promo (UNIQUE) berhasil dibuat');
    } catch (err) {
      console.log(`⚠️  idx_kode_promo: ${err.message}`);
    }

    try {
      await sequelize.query(`
        ALTER TABLE promos 
        ADD INDEX idx_branch_id (branch_id)
      `);
      console.log('✅ Index idx_branch_id berhasil dibuat');
    } catch (err) {
      console.log(`⚠️  idx_branch_id: ${err.message}`);
    }

    try {
      await sequelize.query(`
        ALTER TABLE promos 
        ADD INDEX idx_is_active (is_active)
      `);
      console.log('✅ Index idx_is_active berhasil dibuat');
    } catch (err) {
      console.log(`⚠️  idx_is_active: ${err.message}`);
    }

    console.log('\n✨ Selesai! Coba restart server backend.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPromosIndexes();
