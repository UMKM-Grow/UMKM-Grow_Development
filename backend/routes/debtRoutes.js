const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getDebts,
  createDebt,
  updateDebtStatus,
  deleteDebt,
} = require('../controllers/debtController');

router.use(verifyToken);

router.get('/', getDebts);
router.post('/', createDebt);
router.patch('/:id/status', updateDebtStatus);
router.delete('/:id', deleteDebt);

module.exports = router;
