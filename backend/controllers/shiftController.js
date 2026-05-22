const Shift = require('../models/Shift');
const User = require('../models/User');
const Branch = require('../models/Branch');

// Buka Shift (POST /api/shift/start)
exports.startShift = async (req, res) => {
  try {
    const { user_id, branch_id, saldo_awal } = req.body;

    // Validasi input
    if (!user_id || !branch_id || saldo_awal === undefined) {
      return res.status(400).json({ message: 'user_id, branch_id, dan saldo_awal wajib diisi' });
    }

    // Cek apakah user sudah punya shift aktif
    const activeShift = await Shift.findOne({
      where: {
        user_id,
        status: 'Aktif',
      },
    });

    if (activeShift) {
      return res.status(400).json({ message: 'User sudah memiliki shift aktif. Tutup shift aktif terlebih dahulu.' });
    }

    // Buat shift baru
    const shift = await Shift.create({
      user_id,
      branch_id,
      saldo_awal,
      status: 'Aktif',
    });

    res.status(201).json({
      message: 'Shift berhasil dibuka',
      shift,
    });
  } catch (error) {
    console.error('Error starting shift:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Tutup Shift (PUT /api/shift/end)
exports.endShift = async (req, res) => {
  try {
    const { shift_id, saldo_akhir } = req.body;

    // Validasi input
    if (!shift_id || saldo_akhir === undefined) {
      return res.status(400).json({ message: 'shift_id dan saldo_akhir wajib diisi' });
    }

    // Cari shift berdasarkan ID
    const shift = await Shift.findByPk(shift_id);

    if (!shift) {
      return res.status(404).json({ message: 'Shift tidak ditemukan' });
    }

    // Cek apakah shift sudah selesai
    if (shift.status === 'Selesai') {
      return res.status(400).json({ message: 'Shift sudah selesai' });
    }

    // Update shift
    shift.waktu_selesai = new Date();
    shift.saldo_akhir = saldo_akhir;
    shift.status = 'Selesai';

    await shift.save();

    res.json({
      message: 'Shift berhasil ditutup',
      shift,
    });
  } catch (error) {
    console.error('Error ending shift:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Optional: Get shift history for a user (for Riwayat Shift)
exports.getUserShifts = async (req, res) => {
  try {
    const { user_id } = req.params;

    const shifts = await Shift.findAll({
      where: { user_id },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
      ],
      order: [['waktu_mulai', 'DESC']],
    });

    res.json(shifts);
  } catch (error) {
    console.error('Error fetching user shifts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Optional: Get all shifts (for owner/admin)
exports.getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
      ],
      order: [['waktu_mulai', 'DESC']],
    });

    res.json(shifts);
  } catch (error) {
    console.error('Error fetching all shifts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get active shift for user and branch
exports.getActiveShift = async (req, res) => {
  try {
    const { user_id, branch_id } = req.query;

    // Validasi input
    if (!user_id || !branch_id) {
      return res.status(400).json({ message: 'user_id dan branch_id wajib diisi' });
    }

    // Cari shift aktif untuk user dan branch tertentu
    const activeShift = await Shift.findOne({
      where: {
        user_id,
        branch_id,
        status: 'Aktif',
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Branch, as: 'branch', attributes: ['id', 'name'] },
      ],
    });

    if (!activeShift) {
      return res.status(404).json({ message: 'Shift aktif tidak ditemukan' });
    }

    res.json({
      data: activeShift,
    });
  } catch (error) {
    console.error('Error fetching active shift:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};