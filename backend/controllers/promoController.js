const { Op } = require('sequelize');
const { Promo } = require('../models');

const verifyPromo = async (req, res) => {
  const { kode_promo, total_belanja, branch_id } = req.body || {};
  const code = String(kode_promo || '').trim().toUpperCase();
  const total = Number(total_belanja);
  const branchId = Number(branch_id);

  if (!code) {
    return res.status(400).json({ message: 'Kode promo wajib diisi' });
  }

  if (!Number.isFinite(total) || total < 0) {
    return res.status(400).json({ message: 'Total belanja tidak valid' });
  }

  const today = new Date();
  const where = {
    kode_promo: code,
    is_active: true,
    tanggal_mulai: { [Op.lte]: today },
    tanggal_berakhir: { [Op.gte]: today },
  };

  if (Number.isInteger(branchId) && branchId > 0) {
    where[Op.or] = [{ branch_id: branchId }, { branch_id: null }];
  } else {
    where.branch_id = null;
  }

  const promo = await Promo.findOne({ where });
  if (!promo) {
    return res.status(404).json({ message: 'Kode promo tidak ditemukan atau tidak aktif' });
  }

  const minimal = Number(promo.minimal_belanja) || 0;
  if (total < minimal) {
    return res.status(400).json({ message: 'Total belanja belum memenuhi syarat promo' });
  }

  let discount = 0;
  if (promo.tipe_diskon === 'Nominal') {
    discount = Number(promo.nilai_diskon) || 0;
  } else {
    discount = ((Number(promo.nilai_diskon) || 0) / 100) * total;
  }

  discount = Number.isFinite(discount) ? Math.min(discount, total) : 0;
  discount = Math.round(discount);

  return res.json({
    message: 'Promo valid',
    total_diskon: discount,
    kode_promo: promo.kode_promo,
    tipe_diskon: promo.tipe_diskon,
    nilai_diskon: promo.nilai_diskon,
    minimal_belanja: promo.minimal_belanja,
  });
};

module.exports = { verifyPromo };
