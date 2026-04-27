const path = require('path');
const fs = require('fs');
const { Expense, ensureDbReady } = require('../models');

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');

function ensureUploadsDir() {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch {
    return;
  }
}

const listExpenses = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    const expenses = await Expense.findAll({
      order: [
        ['tanggal', 'DESC'],
        ['id', 'DESC'],
      ],
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load expenses' });
  }
};

const createExpense = async (req, res) => {
  const ready = await ensureDbReady();
  if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

  try {
    ensureUploadsDir();

    const tanggal = String(req.body?.tanggal || '').trim();
    const kategori = String(req.body?.kategori || '').trim();
    const nominalRaw = Number(req.body?.nominal);
    const keteranganRaw = req.body?.keterangan;
    const keterangan =
      keteranganRaw === null || typeof keteranganRaw === 'undefined' ? null : String(keteranganRaw).trim();

    if (!tanggal) return res.status(400).json({ message: 'Tanggal wajib diisi' });
    if (!kategori) return res.status(400).json({ message: 'Kategori wajib diisi' });
    if (!Number.isFinite(nominalRaw) || nominalRaw <= 0) {
      return res.status(400).json({ message: 'Nominal harus lebih dari 0' });
    }

    const userId = Number(req.user?.id) || 1;
    const bukti_foto = req.file?.filename ? String(req.file.filename) : null;

    const created = await Expense.create({
      user_id: userId,
      tanggal,
      kategori,
      nominal: nominalRaw,
      keterangan,
      bukti_foto,
    });

    res.status(201).json({ message: 'Expense created', data: created });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create expense' });
  }
};

module.exports = { listExpenses, createExpense, uploadsDir };
