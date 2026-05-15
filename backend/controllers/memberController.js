const { Member, sequelize } = require('../models');
const { Op } = require('sequelize');

const memberController = {
  // CREATE Member
  createMember: async (req, res) => {
    try {
      const { nama, nomor_telepon, email } = req.body;
      
      const member = await Member.create({
        nama,
        nomor_telepon: String(nomor_telepon || '').trim(),
        email,
      });

      res.status(201).json({ message: 'Member created successfully', data: member });
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

      const where = {};
      if (search) {
        where[Op.or] = [
          { nama: { [Op.like]: `%${search}%` } },
          { nomor_telepon: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Member.findAndCountAll({
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
      const member = await Member.findByPk(req.params.id);
      if (!member) return res.status(404).json({ message: 'Member not found' });
      res.status(200).json({ data: member });
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

      const member = await Member.findOne({
        where: {
          nomor_telepon: {
            [Op.like]: `%${trimmedPhone}%`,
          },
        },
      });

      res.status(200).json({ data: member });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching member', error: error.message });
    }
  },

  // UPDATE Member
  updateMember: async (req, res) => {
    try {
      const { nama, nomor_telepon, email, total_poin, level } = req.body;
      const member = await Member.findByPk(req.params.id);
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      await member.update({
        nama,
        nomor_telepon: nomor_telepon !== undefined ? String(nomor_telepon).trim() : member.nomor_telepon,
        email,
        total_poin,
        level,
      });

      res.status(200).json({ message: 'Member updated successfully', data: member });
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
    const t = await sequelize.transaction();
    try {
      const { member_id, amount } = req.body;
      if (!member_id || !amount || amount <= 0) {
        await t.rollback();
        return res.status(400).json({ message: 'member_id and amount are required and amount must be positive' });
      }

      const member = await Member.findByPk(member_id, { transaction: t });
      if (!member) {
        await t.rollback();
        return res.status(404).json({ message: 'Member not found' });
      }

      const pointsToAdd = Math.floor(amount / 10000); // 1 point per Rp10.000
      if (pointsToAdd > 0) {
        await member.update(
          { total_poin: member.total_poin + pointsToAdd },
          { transaction: t }
        );
      }

      await t.commit();
      res.status(200).json({ message: 'Points added successfully', data: member, points_added: pointsToAdd });
    } catch (error) {
      await t.rollback();
      res.status(500).json({ message: 'Error adding points', error: error.message });
    }
  },
};

module.exports = memberController;
