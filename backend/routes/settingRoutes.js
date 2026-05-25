const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const settingController = require('../controllers/settingController');

// GET /api/settings
router.get('/', verifyToken, settingController.getSetting);

// PUT /api/settings
router.put('/', verifyToken, settingController.updateSetting);

module.exports = router;