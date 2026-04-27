const { ensureDbReady } = require('../models');
const { getFinancialReport } = require('../services/reportService');

const reportController = {
  financial: async (req, res) => {
    const ready = await ensureDbReady();
    if (!ready) return res.status(503).json({ message: 'Database belum tersambung.' });

    try {
      const period = String(req.query.period || 'month');
      const data = await getFinancialReport(period);
      return res.status(200).json({ message: 'OK', data });
    } catch {
      return res.status(500).json({ message: 'Gagal mengambil laporan keuangan.' });
    }
  },
};

module.exports = reportController;
