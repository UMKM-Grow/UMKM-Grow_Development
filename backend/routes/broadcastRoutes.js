const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { sendPromoBroadcast, getBroadcastTargets } = require('../controllers/broadcastController');

// GET /api/broadcast/targets — preview list of recipients
router.get('/targets', verifyToken, getBroadcastTargets);

// POST /api/broadcast/promo — send WA promo broadcast
router.post('/promo', verifyToken, sendPromoBroadcast);

module.exports = router;
