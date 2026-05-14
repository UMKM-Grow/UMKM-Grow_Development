const { Promo } = require('../models');

const verifyPromo = async (req, res) => {
  try {
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

    const promo = await Promo.findOne({
      where: {
        kode_promo: code,
        is_active: true,
      },
    });

    if (!promo) {
      return res.status(404).json({ message: 'Kode promo tidak ditemukan atau sudah tidak aktif.' });
    }

    if (promo.branch_id && promo.branch_id !== branchId) {
      return res.status(400).json({ message: 'Kode promo tidak berlaku di cabang ini!' });
    }

    if (total < Number(promo.minimal_belanja) || Number(promo.minimal_belanja) < 0) {
      return res.status(400).json({ message: `Minimal belanja Rp ${promo.minimal_belanja} belum terpenuhi.` });
    }

    let total_diskon = 0;
    if (promo.tipe_diskon === 'Nominal') {
      total_diskon = Number(promo.nilai_diskon) || 0;
    } else if (promo.tipe_diskon === 'Persentase') {
      total_diskon = ((Number(promo.nilai_diskon) || 0) / 100) * total;
    }

    total_diskon = Number.isFinite(total_diskon) ? Math.min(total_diskon, total) : 0;

    return res.status(200).json({ total_diskon, kode_promo: promo.kode_promo });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { verifyPromo };
