const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { sendPromoBroadcast, getBroadcastTargets, getWaStatus } = require('../controllers/broadcastController');

// GET /api/broadcast/status — WA connection status + QR data URL
router.get('/status', verifyToken, getWaStatus);

// GET /api/broadcast/targets — preview list of recipients
router.get('/targets', verifyToken, getBroadcastTargets);

// POST /api/broadcast/promo — send WA promo broadcast
router.post('/promo', verifyToken, sendPromoBroadcast);

module.exports = router;
