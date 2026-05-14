const express = require('express');
const { verifyPromo } = require('../controllers/promoController');

const router = express.Router();

router.post('/verify', verifyPromo);

module.exports = router;
