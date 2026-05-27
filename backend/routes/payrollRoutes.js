const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  getEmployees,
} = require('../controllers/payrollController');

// All routes protected by verifyToken
router.get('/employees', verifyToken, getEmployees);
router.get('/', verifyToken, getPayrolls);
router.get('/:id', verifyToken, getPayrollById);
router.post('/', verifyToken, createPayroll);
router.put('/:id', verifyToken, updatePayroll);
router.delete('/:id', verifyToken, deletePayroll);

module.exports = router;
