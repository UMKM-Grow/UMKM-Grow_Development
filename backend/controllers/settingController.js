const { StoreSetting, Branch } = require('../models');

// GET /api/settings
exports.getSetting = async (req, res) => {
  try {
    // Assuming req.user is set by authMiddleware and contains user info including branchId
    const userBranchId = req.user.branch_id; // Adjust if the property name is different

    if (!userBranchId) {
      return res.status(400).json({ message: 'User branch not found' });
    }

    const setting = await StoreSetting.findOne({
      where: { branch_id: userBranchId },
      include: [{ model: Branch, attributes: ['id', 'nama_cabang'] }] // Adjust branch attributes as needed
    });

    if (!setting) {
      return res.status(404).json({ message: 'Store setting not found for this branch' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Error fetching store setting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/settings
exports.updateSetting = async (req, res) => {
  try {
    // Only Owner can update settings
    if (req.user.role !== 'Owner') {
      return res.status(403).json({ message: 'Forbidden: Only Owner can update store settings' });
    }

    const userBranchId = req.user.branch_id;
    if (!userBranchId) {
      return res.status(400).json({ message: 'User branch not found' });
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
    const [updated] = await StoreSetting.update(
      {
        nama_toko: nama_toko.trim(),
        alamat: alamat ? alamat.trim() : null,
        nomor_telepon: nomor_telepon ? nomor_telepon.trim() : null,
        service_charge_percent: parseFloat(service_charge_percent),
        tax_percent: parseFloat(tax_percent)
      },
      { where: { branch_id: userBranchId } }
    );

    if (updated) {
      const updatedSetting = await StoreSetting.findOne({ where: { branch_id: userBranchId } });
      res.json({ message: 'Store setting updated successfully', setting: updatedSetting });
    } else {
      res.status(400).json({ message: 'Unable to update store setting' });
    }
  } catch (error) {
    console.error('Error updating store setting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};