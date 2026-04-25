const { Product, ProductVariant } = require('../models');

const listProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true },
      include: [{ model: ProductVariant, as: 'variants', attributes: ['id', 'stock'] }],
      order: [['id', 'ASC']],
    });

    res.json(
      products.map((p) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const stock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
        const price = Number(p.base_price) || 0;
        return {
          id: p.id,
          name: p.name,
          price,
          stock,
          image_url: null,
        };
      })
    );
  } catch (error) {
    res.status(500).json({ message: 'Failed to load products', error: error?.message || String(error) });
  }
};

module.exports = { listProducts };
