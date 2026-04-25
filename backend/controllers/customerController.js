const { Customer } = require('../models');

const listCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: { is_active: true },
      order: [['id', 'ASC']],
      attributes: ['id', 'name', 'phone'],
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load customers', error: error?.message || String(error) });
  }
};

module.exports = { listCustomers };
