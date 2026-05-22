const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/best-seller', verifyToken, analyticsController.bestSeller);

module.exports = router;
