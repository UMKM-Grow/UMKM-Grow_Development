const { Debt, Supplier } = require('../models');

const getBranchId = (req) => {
  const branchId = Number(req.user?.branch_id);
  return Number.isInteger(branchId) && branchId > 0 ? branchId : null;
};

const getDebts = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) {
      return res.status(400).json({ message: 'Branch user tidak ditemukan.' });
    }

    const type = req.query.type ? String(req.query.type) : null;
    const where = { branch_id: branchId };
    if (type === 'Hutang' || type === 'Piutang') {
      where.type = type;
    }

    const debts = await Debt.findAll({
      where,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contact_person', 'phone'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ data: debts });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memuat data hutang/piutang.' });
  }
};

const createDebt = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) {
      return res.status(400).json({ message: 'Branch user tidak ditemukan.' });
    }

    const { type, amount, due_date, supplier_id, customer_name } = req.body;
    const normalizedType = String(type || '').trim();
    const normalizedAmount = Number(amount);

    if (!['Hutang', 'Piutang'].includes(normalizedType)) {
      return res.status(400).json({ message: 'Type harus Hutang atau Piutang.' });
    }

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ message: 'Nominal harus lebih besar dari 0.' });
    }

    if (!due_date) {
      return res.status(400).json({ message: 'Jatuh tempo wajib diisi.' });
    }

    if (normalizedType === 'Hutang') {
      const supplierId = Number(supplier_id);
      if (!Number.isInteger(supplierId) || supplierId <= 0) {
        return res.status(400).json({ message: 'Supplier wajib dipilih untuk data hutang.' });
      }

      const supplier = await Supplier.findOne({ where: { id: supplierId, branch_id: branchId } });
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier tidak ditemukan di cabang ini.' });
      }
    }

    if (normalizedType === 'Piutang' && !String(customer_name || '').trim()) {
      return res.status(400).json({ message: 'Nama pelanggan wajib diisi untuk data piutang.' });
    }

    const debt = await Debt.create({
      type: normalizedType,
      amount: normalizedAmount,
      due_date,
      status: 'Belum Lunas',
      branch_id: branchId,
      supplier_id: normalizedType === 'Hutang' ? Number(supplier_id) : null,
      customer_name: normalizedType === 'Piutang' ? String(customer_name).trim() : null,
    });

    const createdDebt = await Debt.findByPk(debt.id, {
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'name', 'contact_person', 'phone'],
        },
      ],
    });

    return res.status(201).json({ data: createdDebt });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menambahkan data hutang/piutang.' });
  }
};

const updateDebtStatus = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) {
      return res.status(400).json({ message: 'Branch user tidak ditemukan.' });
    }

    const { id } = req.params;
    const debt = await Debt.findOne({ where: { id, branch_id: branchId } });
    if (!debt) {
      return res.status(404).json({ message: 'Data hutang/piutang tidak ditemukan.' });
    }

    const nextStatus = debt.status === 'Lunas' ? 'Belum Lunas' : 'Lunas';
    await debt.update({ status: nextStatus });

    return res.status(200).json({ data: debt });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal memperbarui status hutang/piutang.' });
  }
};

const deleteDebt = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) {
      return res.status(400).json({ message: 'Branch user tidak ditemukan.' });
    }

    const { id } = req.params;
    const debt = await Debt.findOne({ where: { id, branch_id: branchId } });
    if (!debt) {
      return res.status(404).json({ message: 'Data hutang/piutang tidak ditemukan.' });
    }

    await debt.destroy();
    return res.status(200).json({ message: 'Data berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal menghapus data hutang/piutang.' });
  }
};

module.exports = {
  getDebts,
  createDebt,
  updateDebtStatus,
  deleteDebt,
};
