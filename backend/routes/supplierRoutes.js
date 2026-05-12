const express = require('express');
const router = express.Router();
const {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierHistory
} = require('../controllers/supplierController');

router.get('/', getAllSuppliers);
router.get('/:id/history', getSupplierHistory);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;
