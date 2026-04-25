const { Customer } = require('../models');

const listCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({ order: [['id', 'ASC']] });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load customers' });
  }
};

module.exports = { listCustomers };
