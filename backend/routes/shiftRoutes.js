const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Protect all shift routes with authentication
router.use(verifyToken);

// Buka Shift
router.post('/start', shiftController.startShift);

// Tutup Shift
router.put('/end', shiftController.endShift);

// Get active shift for user and branch
router.get('/active', shiftController.getActiveShift);

// Riwayat Shift untuk user tertentu
router.get('/user/:user_id', shiftController.getUserShifts);

// Riwayat Shift semua (untuk owner/admin)
router.get('/', shiftController.getAllShifts);

module.exports = router;