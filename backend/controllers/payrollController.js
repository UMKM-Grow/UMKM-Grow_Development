const { Payroll, User, ensureDbReady } = require('../models');
const { Op } = require('sequelize');

// GET /api/payroll
const getPayrolls = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    const branchId = Number(req.query.branch_id);
    const where = {};
    if (Number.isInteger(branchId) && branchId > 0) {
      where.branch_id = branchId;
    }

    const payrolls = await Payroll.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
      order: [
        ['periode', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    res.json(payrolls);
  } catch (error) {
    console.error('getPayrolls error:', error);
    res.status(500).json({ message: 'Gagal mengambil data penggajian.' });
  }
};

// GET /api/payroll/:id
const getPayrollById = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    const payroll = await Payroll.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
    });
    if (!payroll) return res.status(404).json({ message: 'Data penggajian tidak ditemukan.' });
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data penggajian.' });
  }
};

// POST /api/payroll
const createPayroll = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    const { user_id, periode, base_salary, bonus, deductions, notes } = req.body;

    if (!user_id) return res.status(400).json({ message: 'Karyawan wajib dipilih.' });
    if (!periode) return res.status(400).json({ message: 'Periode wajib diisi.' });

    const baseSalaryNum = Number(base_salary) || 0;
    const bonusNum = Number(bonus) || 0;
    const deductionsNum = Number(deductions) || 0;

    if (baseSalaryNum < 0) return res.status(400).json({ message: 'Gaji pokok tidak boleh negatif.' });
    if (bonusNum < 0) return res.status(400).json({ message: 'Bonus tidak boleh negatif.' });
    if (deductionsNum < 0) return res.status(400).json({ message: 'Potongan tidak boleh negatif.' });

    // Auto-calculate total salary
    const total_salary = baseSalaryNum + bonusNum - deductionsNum;

    const branchId = Number(req.body.branch_id);
    const selectedBranchId = Number.isInteger(branchId) && branchId > 0 ? branchId : null;

    // Prevent duplicate payroll for same user + periode + branch
    const existing = await Payroll.findOne({
      where: {
        user_id: Number(user_id),
        periode: String(periode).trim(),
        ...(selectedBranchId ? { branch_id: selectedBranchId } : {}),
      },
    });
    if (existing) {
      return res.status(409).json({ message: 'Penggajian untuk karyawan ini pada periode tersebut sudah ada.' });
    }

    const payroll = await Payroll.create({
      user_id: Number(user_id),
      branch_id: selectedBranchId,
      periode: String(periode).trim(),
      base_salary: baseSalaryNum,
      bonus: bonusNum,
      deductions: deductionsNum,
      total_salary,
      notes: notes ? String(notes).trim() : null,
    });

    // Return with user data
    const result = await Payroll.findByPk(payroll.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
    });

    res.status(201).json({ message: 'Penggajian berhasil disimpan.', data: result });
  } catch (error) {
    console.error('createPayroll error:', error);
    res.status(500).json({ message: 'Gagal menyimpan data penggajian.' });
  }
};

// PUT /api/payroll/:id
const updatePayroll = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    const payroll = await Payroll.findByPk(req.params.id);
    if (!payroll) return res.status(404).json({ message: 'Data penggajian tidak ditemukan.' });

    const { base_salary, bonus, deductions, notes } = req.body;

    const baseSalaryNum = base_salary !== undefined ? Number(base_salary) : Number(payroll.base_salary);
    const bonusNum = bonus !== undefined ? Number(bonus) : Number(payroll.bonus);
    const deductionsNum = deductions !== undefined ? Number(deductions) : Number(payroll.deductions);
    const total_salary = baseSalaryNum + bonusNum - deductionsNum;

    await payroll.update({ base_salary: baseSalaryNum, bonus: bonusNum, deductions: deductionsNum, total_salary, notes: notes !== undefined ? (notes ? String(notes).trim() : null) : payroll.notes });

    const result = await Payroll.findByPk(payroll.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
    });
    res.json({ message: 'Data penggajian berhasil diperbarui.', data: result });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui data penggajian.' });
  }
};

// DELETE /api/payroll/:id
const deletePayroll = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    const payroll = await Payroll.findByPk(req.params.id);
    if (!payroll) return res.status(404).json({ message: 'Data penggajian tidak ditemukan.' });

    await payroll.destroy();
    res.json({ message: 'Data penggajian berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus data penggajian.' });
  }
};

// GET /api/payroll/employees - get employees (users) by branch for dropdown
const getEmployees = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    const branchId = Number(req.query.branch_id);
    const where = { is_active: true };
    if (Number.isInteger(branchId) && branchId > 0) {
      where.branch_id = branchId;
    }

    const employees = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'branch_id'],
      order: [['name', 'ASC']],
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data karyawan.' });
  }
};

module.exports = { getPayrolls, getPayrollById, createPayroll, updatePayroll, deletePayroll, getEmployees };
