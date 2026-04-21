const { Customer, Transaction, ensureDbReady } = require('../models');
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

const dbNotReadyResponse = (res) =>
  res.status(503).json({ message: 'Database belum tersambung. Pastikan MySQL berjalan dan konfigurasi DB sudah benar.' });

const customerController = {
  getAllCustomers: async (req, res) => {
    const ready = await ensureDbReady();
    if (!ready) return dbNotReadyResponse(res);

    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
      const normalizedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
      const offset = (normalizedPage - 1) * normalizedLimit;

      const rawSearch = String(search || '').trim();
      const where = {
        is_active: true,
        ...(rawSearch
          ? {
              [Op.or]: [
                { name: { [Op.like]: `%${rawSearch}%` } },
                { phone: { [Op.like]: `%${rawSearch}%` } },
              ],
            }
          : {}),
      };

      const { count, rows } = await Customer.findAndCountAll({
        where,
        limit: normalizedLimit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        data: rows,
        totalPages: Math.ceil(count / normalizedLimit),
        currentPage: normalizedPage,
        totalData: count,
      });
    } catch (error) {
      if (isDbConnectionError(error)) {
        return dbNotReadyResponse(res);
      }
      res.status(500).json({ message: error.message || 'Error fetching customers' });
    }
  },

  createCustomer: async (req, res) => {
    const ready = await ensureDbReady();
    if (!ready) return dbNotReadyResponse(res);

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

      const customer = await Customer.create({ name, phone, email: email || null, address, is_active: true });
      res.status(201).json({ message: 'Customer created successfully', data: customer });
    } catch (error) {
      if (isDbConnectionError(error)) {
        return dbNotReadyResponse(res);
      }
      const isUniqueError =
        error?.name === 'SequelizeUniqueConstraintError' || error?.name === 'SequelizeValidationError';
      if (isUniqueError) {
        return res.status(409).json({ message: 'No HP sudah terpakai.' });
      }
      res.status(500).json({ message: error.message || 'Error creating customer' });
    }
  },

  updateCustomer: async (req, res) => {
    const ready = await ensureDbReady();
    if (!ready) return dbNotReadyResponse(res);

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
        return dbNotReadyResponse(res);
      }
      const isUniqueError =
        error?.name === 'SequelizeUniqueConstraintError' || error?.name === 'SequelizeValidationError';
      if (isUniqueError) {
        return res.status(409).json({ message: 'No HP sudah terpakai.' });
      }
      res.status(500).json({ message: error.message || 'Error updating customer' });
    }
  },

  deleteCustomer: async (req, res) => {
    const ready = await ensureDbReady();
    if (!ready) return dbNotReadyResponse(res);

    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      await customer.update({ is_active: false });
      res.status(200).json({ message: 'Customer soft deleted successfully' });
    } catch (error) {
      if (isDbConnectionError(error)) {
        return dbNotReadyResponse(res);
      }
      res.status(500).json({ message: error.message || 'Error deleting customer' });
    }
  },

  getCustomerTransactions: async (req, res) => {
    const ready = await ensureDbReady();
    if (!ready) return dbNotReadyResponse(res);

    try {
      const customerId = parseInt(req.params.id, 10);
      if (!Number.isFinite(customerId)) {
        return res.status(400).json({ message: 'Customer ID tidak valid.' });
      }

      const customer = await Customer.findByPk(customerId);
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      const { page = 1, limit = 10 } = req.query;
      const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
      const normalizedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
      const offset = (normalizedPage - 1) * normalizedLimit;

      const { count, rows } = await Transaction.findAndCountAll({
        where: { customer_id: customerId },
        limit: normalizedLimit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        data: rows.map((t) => ({
          id: t.id,
          customer_id: t.customer_id,
          total_price: t.total_price,
          status: t.status,
          date: t.createdAt,
        })),
        totalPages: Math.ceil(count / normalizedLimit),
        currentPage: normalizedPage,
        totalData: count,
      });
    } catch (error) {
      if (isDbConnectionError(error)) {
        return dbNotReadyResponse(res);
      }
      res.status(500).json({ message: error.message || 'Error fetching customer transactions' });
    }
  },
};

module.exports = customerController;
