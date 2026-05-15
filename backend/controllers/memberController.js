const { Customer, sequelize } = require('../models');
const { Op } = require('sequelize');

const memberController = {
  // CREATE Member
  createMember: async (req, res) => {
    try {
      const { nama, nomor_telepon, email, address } = req.body;
      
      const customer = await Customer.create({
        name: nama,
        phone: String(nomor_telepon || '').trim(),
        email,
        address: address || '',
        is_active: true,
      });

      res.status(201).json({ message: 'Member created successfully', data: customer });
    } catch (error) {
      const isUniqueError = error?.name === 'SequelizeUniqueConstraintError';
      if (isUniqueError) {
        return res.status(409).json({ message: 'Nomor telepon sudah terdaftar' });
      }
      res.status(500).json({ message: 'Error creating member', error: error.message });
    }
  },

  // READ All Members
  getAllMembers: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;

      const where = { is_active: true };
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Customer.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching members', error: error.message });
    }
  },

  // READ One Member
  getMemberById: async (req, res) => {
    try {
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Member not found' });
      res.status(200).json({ data: customer });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching member', error: error.message });
    }
  },

  // READ Member by Phone
  getMemberByPhone: async (req, res) => {
    try {
      const { nomor_telepon } = req.query;
      if (!nomor_telepon) {
        return res.status(400).json({ message: 'nomor_telepon is required' });
      }

      const trimmedPhone = String(nomor_telepon || '').trim();

      const customer = await Customer.findOne({
        where: {
          phone: {
            [Op.like]: `%${trimmedPhone}%`,
          },
          is_active: true,
        },
      });

      res.status(200).json({ data: customer });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching member', error: error.message });
    }
  },

  // UPDATE Member
  updateMember: async (req, res) => {
    try {
      const { nama, nomor_telepon, email, loyalty_points, level, address } = req.body;
      const customer = await Customer.findByPk(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: 'Member not found' });
      }

      await customer.update({
        name: nama,
        phone: nomor_telepon !== undefined ? String(nomor_telepon).trim() : customer.phone,
        email,
        loyalty_points,
        level,
        address,
      });

      res.status(200).json({ message: 'Member updated successfully', data: customer });
    } catch (error) {
      const isUniqueError = error?.name === 'SequelizeUniqueConstraintError';
      if (isUniqueError) {
        return res.status(409).json({ message: 'Nomor telepon sudah terdaftar' });
      }
      res.status(500).json({ message: 'Error updating member', error: error.message });
    }
  },

  // Add Points to Member
  addPoints: async (req, res) => {
    console.log('[addPoints] Request body:', req.body);
    const t = await sequelize.transaction();
    try {
      const { member_id, amount } = req.body;
      console.log('[addPoints] member_id:', member_id, 'amount:', amount);
      
      if (!member_id || !amount || amount <= 0) {
        await t.rollback();
        return res.status(400).json({ message: 'member_id and amount are required and amount must be positive' });
      }

      const customer = await Customer.findByPk(member_id, { transaction: t });
      console.log('[addPoints] Found customer:', customer);
      
      if (!customer) {
        await t.rollback();
        return res.status(404).json({ message: 'Member not found' });
      }

      const pointsToAdd = Math.floor(amount / 10000); // 1 point per Rp10.000
      console.log('[addPoints] Calculated points to add:', pointsToAdd);
      
      if (pointsToAdd > 0) {
        await customer.update(
          { loyalty_points: customer.loyalty_points + pointsToAdd },
          { transaction: t }
        );
        console.log('[addPoints] Updated customer loyalty_points:', customer.loyalty_points + pointsToAdd);
      }

      await t.commit();
      console.log('[addPoints] Transaction committed');
      res.status(200).json({ message: 'Points added successfully', data: customer, points_added: pointsToAdd });
    } catch (error) {
      await t.rollback();
      console.error('[addPoints] Error:', error);
      res.status(500).json({ message: 'Error adding points', error: error.message });
    }
  },
};

module.exports = memberController;
