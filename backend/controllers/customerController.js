const { Customer, isDbReady } = require('../models');
const { Op } = require('sequelize');

const isDbConnectionError = (error) => {
  const name = String(error?.name || '');
  const parentCode = error?.parent?.code;
  const originalCode = error?.original?.code;
  return (
    name.includes('SequelizeConnection') ||
    parentCode === 'ECONNREFUSED' ||
    originalCode === 'ECONNREFUSED'
  );
};

const customerController = {
  getAllCustomers: async (req, res) => {
    if (!isDbReady()) {
      return res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan dan konfigurasi DB sudah benar.' });
    }

    try {
      const customers = await Customer.findAll({ order: [['createdAt', 'DESC']] });
      res.status(200).json({ data: customers });
    } catch (error) {
      if (isDbConnectionError(error)) {
        return res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan dan konfigurasi DB sudah benar.' });
      }
      res.status(500).json({ message: 'Error fetching customers', error: error.message });
    }
  },

  createCustomer: async (req, res) => {
    if (!isDbReady()) {
      return res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan dan konfigurasi DB sudah benar.' });
    }

    try {
      const name = String(req.body?.name ?? '').trim();
      const phone = String(req.body?.phone ?? '').trim();
      const emailRaw = req.body?.email;
      const email = emailRaw === null || typeof emailRaw === 'undefined' ? null : String(emailRaw).trim();
      const address = String(req.body?.address ?? '').trim();

      if (!name) return res.status(400).json({ message: 'Nama pelanggan wajib diisi.' });
      if (!phone) return res.status(400).json({ message: 'No HP wajib diisi.' });
      if (!address) return res.status(400).json({ message: 'Alamat wajib diisi.' });

      const existing = await Customer.findOne({ where: { phone } });
      if (existing) return res.status(409).json({ message: 'No HP sudah terpakai.' });

      const customer = await Customer.create({ name, phone, email: email || null, address });
      res.status(201).json({ message: 'Customer created successfully', data: customer });
    } catch (error) {
      if (isDbConnectionError(error)) {
        return res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan dan konfigurasi DB sudah benar.' });
      }
      const isUniqueError =
        error?.name === 'SequelizeUniqueConstraintError' || error?.name === 'SequelizeValidationError';
      if (isUniqueError) {
        return res.status(409).json({ message: 'No HP sudah terpakai.' });
      }
      res.status(500).json({ message: 'Error creating customer', error: error.message });
    }
  },

  updateCustomer: async (req, res) => {
    if (!isDbReady()) {
      return res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan dan konfigurasi DB sudah benar.' });
    }

    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      const name = String(req.body?.name ?? '').trim();
      const phone = String(req.body?.phone ?? '').trim();
      const emailRaw = req.body?.email;
      const email = emailRaw === null || typeof emailRaw === 'undefined' ? null : String(emailRaw).trim();
      const address = String(req.body?.address ?? '').trim();

      if (!name) return res.status(400).json({ message: 'Nama pelanggan wajib diisi.' });
      if (!phone) return res.status(400).json({ message: 'No HP wajib diisi.' });
      if (!address) return res.status(400).json({ message: 'Alamat wajib diisi.' });

      const phoneChanged = phone !== String(customer.phone || '');
      if (phoneChanged) {
        const existing = await Customer.findOne({
          where: {
            phone,
            id: { [Op.ne]: customer.id },
          },
        });
        if (existing) return res.status(409).json({ message: 'No HP sudah terpakai.' });
      }

      await customer.update({ name, phone, email: email || null, address });
      res.status(200).json({ message: 'Customer updated successfully', data: customer });
    } catch (error) {
      if (isDbConnectionError(error)) {
        return res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan dan konfigurasi DB sudah benar.' });
      }
      const isUniqueError =
        error?.name === 'SequelizeUniqueConstraintError' || error?.name === 'SequelizeValidationError';
      if (isUniqueError) {
        return res.status(409).json({ message: 'No HP sudah terpakai.' });
      }
      res.status(500).json({ message: 'Error updating customer', error: error.message });
    }
  },

  deleteCustomer: async (req, res) => {
    if (!isDbReady()) {
      return res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan dan konfigurasi DB sudah benar.' });
    }

    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      await customer.destroy();
      res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
      if (isDbConnectionError(error)) {
        return res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan dan konfigurasi DB sudah benar.' });
      }
      res.status(500).json({ message: 'Error deleting customer', error: error.message });
    }
  },
};

module.exports = customerController;
