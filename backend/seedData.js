const { User, Branch, StoreSetting, sequelize } = require('./models');

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Create branches
    const branches = await Promise.all([
      Branch.findOrCreate({
        where: { nama_cabang: 'Cabang Utama' },
        defaults: {
          nama_cabang: 'Cabang Utama',
          lokasi: 'Jl. Raya Utama No. 123, Jakarta'
        }
      }),
      Branch.findOrCreate({
        where: { nama_cabang: 'Cabang Selatan' },
        defaults: {
          nama_cabang: 'Cabang Selatan',
          lokasi: 'Jl. Raya Selatan No. 45, Jakarta Selatan'
        }
      })
    ]);

    const cabangUtama = branches[0][0];
    const cabangSelatan = branches[1][0];
    console.log('Branches created/loaded:', cabangUtama.nama_cabang, cabangSelatan.nama_cabang);

    // Create users with different roles
    const users = await Promise.all([
      User.findOrCreate({
        where: { email: 'admin@example.com' },
        defaults: {
          name: 'Admin Utama',
          email: 'admin@example.com',
          password: 'password123',
          role: 'admin',
          branch_id: cabangUtama.id_cabang,
          is_active: true
        }
      }),
      User.findOrCreate({
        where: { email: 'kasir@example.com' },
        defaults: {
          name: 'Kasir Cabang Utama',
          email: 'kasir@example.com',
          password: 'password123',
          role: 'kasir',
          branch_id: cabangUtama.id_cabang,
          is_active: true
        }
      }),
      User.findOrCreate({
        where: { email: 'hrd@example.com' },
        defaults: {
          name: 'HRD Utama',
          email: 'hrd@example.com',
          password: 'password123',
          role: 'hrd',
          branch_id: cabangUtama.id_cabang,
          is_active: true
        }
      })
    ]);

    const adminUser = users[0][0];
    const kasirUser = users[1][0];
    const hrdUser = users[2][0];
    console.log('Users created/loaded:');
    console.log('- Admin:', adminUser.email, 'Role:', adminUser.role);
    console.log('- Kasir:', kasirUser.email, 'Role:', kasirUser.role);
    console.log('- HRD:', hrdUser.email, 'Role:', hrdUser.role);

    // Create store settings
    const settings = await Promise.all([
      StoreSetting.findOrCreate({
        where: { branch_id: cabangUtama.id_cabang },
        defaults: {
          branch_id: cabangUtama.id_cabang,
          nama_toko: 'UMKM Grow Cabang Utama',
          alamat: cabangUtama.lokasi,
          nomor_telepon: '021-1234567',
          service_charge_percent: 5.00,
          tax_percent: 11.00
        }
      }),
      StoreSetting.findOrCreate({
        where: { branch_id: cabangSelatan.id_cabang },
        defaults: {
          branch_id: cabangSelatan.id_cabang,
          nama_toko: 'UMKM Grow Cabang Selatan',
          alamat: cabangSelatan.lokasi,
          nomor_telepon: '021-7654321',
          service_charge_percent: 0.00,
          tax_percent: 11.00
        }
      })
    ]);

    const settingUtama = settings[0][0];
    const settingSelatan = settings[1][0];
    console.log('Store settings created/loaded');

    console.log('\n=== Seed completed successfully! ===');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@example.com / password123');
    console.log('Kasir: kasir@example.com / password123');
    console.log('HRD: hrd@example.com / password123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await sequelize.close();
  }
}

seedData();
