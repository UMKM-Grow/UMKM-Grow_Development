const { Product } = require('../models');

const listProducts = async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['id', 'ASC']] });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load products' });
  }
};

module.exports = { listProducts };
