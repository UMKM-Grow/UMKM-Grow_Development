const { Shift, User, Branch } = require("../models");

const shiftInclude = [
  { model: User, as: "user", attributes: ["id", "name", "email"] },
  { model: Branch, as: "branch", attributes: ["id_cabang", "nama_cabang"] },
];

// Buka Shift (POST /api/shifts/start)
exports.startShift = async (req, res) => {
  try {
    const { user_id, branch_id, saldo_awal } = req.body;

    if (!user_id || !branch_id || saldo_awal === undefined) {
      return res
        .status(400)
        .json({ message: "user_id, branch_id, dan saldo_awal wajib diisi" });
    }

    const saldoAwalNumber = Number(saldo_awal);
    if (Number.isNaN(saldoAwalNumber) || saldoAwalNumber < 0) {
      return res.status(400).json({
        message: "saldo_awal harus berupa angka yang valid dan tidak negatif",
      });
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      return res.status(404).json({ message: "Cabang tidak ditemukan" });
    }

    if (user.branch_id && Number(user.branch_id) !== Number(branch_id)) {
      return res
        .status(400)
        .json({ message: "User tidak terdaftar pada cabang yang dipilih" });
    }

    const activeShift = await Shift.findOne({
      where: {
        user_id,
        branch_id,
        status: "Aktif",
      },
    });

    if (activeShift) {
      return res.status(400).json({
        message:
          "User sudah memiliki shift aktif di cabang ini. Tutup shift aktif terlebih dahulu.",
      });
    }

    const shift = await Shift.create({
      user_id,
      branch_id,
      saldo_awal: saldoAwalNumber,
      status: "Aktif",
    });

    const createdShift = await Shift.findByPk(shift.id, {
      include: shiftInclude,
    });

    return res.status(201).json({
      message: "Shift berhasil dibuka",
      data: createdShift,
    });
  } catch (error) {
    console.error("Error starting shift:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Tutup Shift (PUT /api/shifts/end)
exports.endShift = async (req, res) => {
  try {
    const { shift_id, saldo_akhir } = req.body;

    if (!shift_id || saldo_akhir === undefined) {
      return res
        .status(400)
        .json({ message: "shift_id dan saldo_akhir wajib diisi" });
    }

    const saldoAkhirNumber = Number(saldo_akhir);
    if (Number.isNaN(saldoAkhirNumber) || saldoAkhirNumber < 0) {
      return res.status(400).json({
        message: "saldo_akhir harus berupa angka yang valid dan tidak negatif",
      });
    }

    const shift = await Shift.findByPk(shift_id);

    if (!shift) {
      return res.status(404).json({ message: "Shift tidak ditemukan" });
    }

    if (shift.status === "Selesai") {
      return res.status(400).json({ message: "Shift sudah selesai" });
    }

    if (saldoAkhirNumber < Number(shift.saldo_awal)) {
      return res.status(400).json({
        message: "saldo_akhir tidak boleh lebih kecil dari saldo_awal",
      });
    }

    shift.waktu_selesai = new Date();
    shift.saldo_akhir = saldoAkhirNumber;
    shift.status = "Selesai";

    await shift.save();

    const closedShift = await Shift.findByPk(shift.id, {
      include: shiftInclude,
    });

    return res.json({
      message: "Shift berhasil ditutup",
      data: closedShift,
    });
  } catch (error) {
    console.error("Error ending shift:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Optional: Get shift history for a user (for Riwayat Shift)
exports.getUserShifts = async (req, res) => {
  try {
    const { user_id } = req.params;

    const shifts = await Shift.findAll({
      where: { user_id },
      include: shiftInclude,
      order: [["waktu_mulai", "DESC"]],
    });

    return res.json({ data: shifts });
  } catch (error) {
    console.error("Error fetching user shifts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Optional: Get all shifts (for owner/admin)
exports.getAllShifts = async (req, res) => {
  try {
    const shifts = await Shift.findAll({
      include: shiftInclude,
      order: [["waktu_mulai", "DESC"]],
    });

    return res.json({ data: shifts });
  } catch (error) {
    console.error("Error fetching all shifts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get active shift for user and branch
exports.getActiveShift = async (req, res) => {
  try {
    const { user_id, branch_id } = req.query;

    if (!user_id || !branch_id) {
      return res
        .status(400)
        .json({ message: "user_id dan branch_id wajib diisi" });
    }

    const activeShift = await Shift.findOne({
      where: {
        user_id,
        branch_id,
        status: "Aktif",
      },
      include: shiftInclude,
      order: [["waktu_mulai", "DESC"]],
    });

    return res.json({
      data: activeShift || null,
    });
  } catch (error) {
    console.error("Error fetching active shift:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
