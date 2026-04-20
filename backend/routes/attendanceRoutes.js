const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, attendanceController.createAttendance);
router.get('/my-history', verifyToken, attendanceController.getMyHistory);

module.exports = router;
