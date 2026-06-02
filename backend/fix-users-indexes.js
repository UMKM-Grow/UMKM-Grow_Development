/**
 * =====================================================
 * Script untuk fix error: Too many keys specified
 * =====================================================
 * Problem: Tabel users memiliki > 64 indexes
 * Solution: Drop duplicate indexes dan rebuild yang perlu
 * =====================================================
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umkm_grow',
};

async function fixUsersIndexes() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database:', dbConfig.database);

    // Step 1: Check current indexes
    console.log('\n📋 Step 1: Checking current indexes on users table...');
    const [indexes] = await connection.query(`
      SELECT 
        INDEX_NAME, 
        NON_UNIQUE, 
        COLUMN_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [dbConfig.database]);

    console.log(`Found ${indexes.length} index entries`);
    
    // Group by index name
    const indexGroups = {};
    indexes.forEach(idx => {
      if (!indexGroups[idx.INDEX_NAME]) {
        indexGroups[idx.INDEX_NAME] = [];
      }
      indexGroups[idx.INDEX_NAME].push(idx.COLUMN_NAME);
    });

    console.log('\nCurrent indexes:');
    Object.entries(indexGroups).forEach(([name, columns]) => {
      console.log(`  - ${name}: ${columns.join(', ')}`);
    });

    // Step 2: Drop all indexes except PRIMARY
    console.log('\n🗑️  Step 2: Dropping all indexes except PRIMARY...');
    
    for (const indexName of Object.keys(indexGroups)) {
      if (indexName === 'PRIMARY') {
        console.log(`  ⏩ Skipping PRIMARY key`);
        continue;
      }

      try {
        await connection.query(`DROP INDEX \`${indexName}\` ON \`users\``);
        console.log(`  ✅ Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`  ⚠️  Failed to drop ${indexName}: ${error.message}`);
      }
    }

    // Step 3: Create necessary indexes
    console.log('\n🔨 Step 3: Creating necessary indexes...');

    const indexesToCreate = [
      {
        name: 'users_email_unique',
        query: 'CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`)',
        description: 'Unique index on email'
      },
      {
        name: 'users_branch_id',
        query: 'CREATE INDEX `users_branch_id` ON `users` (`branch_id`)',
        description: 'Index on branch_id for joins'
      },
      {
        name: 'users_is_active',
        query: 'CREATE INDEX `users_is_active` ON `users` (`is_active`)',
        description: 'Index on is_active for filtering'
      },
      {
        name: 'users_role',
        query: 'CREATE INDEX `users_role` ON `users` (`role`)',
        description: 'Index on role for filtering'
      }
    ];

    for (const index of indexesToCreate) {
      try {
        await connection.query(index.query);
        console.log(`  ✅ Created: ${index.name} (${index.description})`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`  ⏩ Already exists: ${index.name}`);
        } else {
          console.log(`  ⚠️  Failed: ${index.name} - ${error.message}`);
        }
      }
    }

    // Step 4: Verify final state
    console.log('\n✔️  Step 4: Verifying final indexes...');
    const [finalIndexes] = await connection.query(`
      SELECT 
        INDEX_NAME, 
        NON_UNIQUE,
        GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      GROUP BY INDEX_NAME, NON_UNIQUE
      ORDER BY INDEX_NAME
    `, [dbConfig.database]);

    console.log('\nFinal indexes:');
    finalIndexes.forEach(idx => {
      const uniqueStr = idx.NON_UNIQUE === 0 ? ' (UNIQUE)' : '';
      console.log(`  - ${idx.INDEX_NAME}: ${idx.COLUMNS}${uniqueStr}`);
    });

    console.log(`\n✅ Total indexes: ${finalIndexes.length} (should be ≤ 10)`);
    
    if (finalIndexes.length <= 10) {
      console.log('\n🎉 SUCCESS! Indexes fixed successfully!');
      console.log('You can now restart your backend server.');
    } else {
      console.log('\n⚠️  WARNING: Still many indexes. Consider manual cleanup.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed.');
    }
  }
}

// Run the fix
console.log('🚀 Starting users table indexes fix...\n');
fixUsersIndexes().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
