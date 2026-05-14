const { Branch, User } = require('../models');

exports.listBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({ order: [['id_cabang', 'ASC']] });
    res.json(branches);
  } catch (error) {
    console.error('listBranches error', error);
    res.status(500).json({ error: 'Unable to load branches' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({ 
      where: { is_active: true },
      attributes: ['id', 'name', 'email', 'role'],
      order: [['name', 'ASC']]
    });
    res.json(users);
  } catch (error) {
    console.error('listUsers error', error);
    res.status(500).json({ error: 'Unable to load users' });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const { nama_cabang, lokasi, manager_id } = req.body;
    // manager_id is optional - can be null
    const branch = await Branch.create({ 
      nama_cabang, 
      lokasi, 
      manager_id: manager_id || null 
    });
    res.status(201).json(branch);
  } catch (error) {
    console.error('createBranch error', error);
    res.status(500).json({ error: 'Unable to create branch', details: error.message });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_cabang, lokasi, manager_id } = req.body;
    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    await branch.update({ nama_cabang, lokasi, manager_id });
    res.json(branch);
  } catch (error) {
    console.error('updateBranch error', error);
    res.status(500).json({ error: 'Unable to update branch' });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    await branch.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('deleteBranch error', error);
    res.status(500).json({ error: 'Unable to delete branch' });
  }
};
