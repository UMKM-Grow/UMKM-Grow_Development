const { ensureDbReady, Product, Transaction, TransactionDetail, sequelize } = require('../models');

const analyticsController = {
  bestSeller: async (req, res) => {
    const ready = await ensureDbReady();
    if (!ready) return res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan.' });

    try {
      const branchId = Number(req.query.branch_id);
      if (!Number.isInteger(branchId) || branchId <= 0) {
        return res.status(400).json({ message: 'branch_id tidak valid atau tidak ditemukan.' });
      }

      const bestSellers = await TransactionDetail.findAll({
        attributes: [
          'product_id',
          [sequelize.fn('SUM', sequelize.col('quantity')), 'total_terjual'],
        ],
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name'],
          },
          {
            model: Transaction,
            attributes: [],
            where: { branch_id: branchId },
          },
        ],
        group: ['product_id', 'product.id', 'product.name'],
        order: [[sequelize.literal('total_terjual'), 'DESC']],
        limit: 5,
      });

      const data = bestSellers.map((item, index) => ({
        product_id: item.product_id,
        name: item.product?.name || 'Produk tidak dikenal',
        total_terjual: Number(item.get('total_terjual')) || 0,
        rank: index + 1,
      }));

      return res.status(200).json({ message: 'OK', data });
    } catch (error) {
      return res.status(500).json({ message: 'Gagal mengambil best seller.', error: error.message });
    }
  },
};

module.exports = analyticsController;
