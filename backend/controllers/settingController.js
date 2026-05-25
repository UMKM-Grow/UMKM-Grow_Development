const { StoreSetting, Branch } = require('../models');

// GET /api/settings
exports.getSetting = async (req, res) => {
  try {
    console.log('Auth user:', req.user);
    // Assuming req.user is set by authMiddleware and contains user info including branchId
    let userBranchId = req.user.branch_id;
    console.log('User branch ID:', userBranchId);

    if (!userBranchId) {
      // If user has no branch, get or create default branch
      let defaultBranch = await Branch.findOne();
      if (!defaultBranch) {
        defaultBranch = await Branch.create({
          nama_cabang: 'Cabang Utama',
          lokasi: 'Lokasi Utama'
        });
      }
      userBranchId = defaultBranch.id_cabang;
      console.log('Using default branch ID:', userBranchId);
    }

    let setting = await StoreSetting.findOne({
      where: { branch_id: userBranchId }
    });
    console.log('Setting found:', setting ? 'yes' : 'no');

    if (!setting) {
      // Create default setting if not exists
      setting = await StoreSetting.create({
        branch_id: userBranchId,
        nama_toko: 'UMKM Grow',
        alamat: null,
        nomor_telepon: null,
        service_charge_percent: 0.00,
        tax_percent: 0.00
      });
      console.log('Created default setting');
    }

    console.log('Sending setting:', JSON.stringify(setting));
    res.json(setting);
  } catch (error) {
    console.error('Error fetching store setting:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/settings
exports.updateSetting = async (req, res) => {
  try {
    // Only admin can update settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admin can update store settings' });
    }

    let userBranchId = req.user.branch_id;
    if (!userBranchId) {
      // If user has no branch, get or create default branch
      let defaultBranch = await Branch.findOne();
      if (!defaultBranch) {
        defaultBranch = await Branch.create({
          nama_cabang: 'Cabang Utama',
          lokasi: 'Lokasi Utama'
        });
      }
      userBranchId = defaultBranch.id_cabang;
    }

    const {
      nama_toko,
      alamat,
      nomor_telepon,
      service_charge_percent,
      tax_percent
    } = req.body;

    // Validate input
    if (!nama_toko || nama_toko.trim() === '') {
      return res.status(400).json({ message: 'Nama toko is required' });
    }

    // Update or create setting
    const [setting, created] = await StoreSetting.findOrCreate({
      where: { branch_id: userBranchId },
      defaults: {
        nama_toko: nama_toko.trim(),
        alamat: alamat ? alamat.trim() : null,
        nomor_telepon: nomor_telepon ? nomor_telepon.trim() : null,
        service_charge_percent: parseFloat(service_charge_percent) || 0.00,
        tax_percent: parseFloat(tax_percent) || 0.00
      }
    });

    if (!created) {
      // Update existing setting
      await setting.update({
        nama_toko: nama_toko.trim(),
        alamat: alamat ? alamat.trim() : null,
        nomor_telepon: nomor_telepon ? nomor_telepon.trim() : null,
        service_charge_percent: parseFloat(service_charge_percent) || 0.00,
        tax_percent: parseFloat(tax_percent) || 0.00
      });
    }

    const updatedSetting = await StoreSetting.findOne({ where: { branch_id: userBranchId } });
    res.json(updatedSetting);
  } catch (error) {
    console.error('Error updating store setting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};