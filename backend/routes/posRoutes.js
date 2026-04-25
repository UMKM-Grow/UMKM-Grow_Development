const express = require('express');
const { checkout } = require('../controllers/posController');

const router = express.Router();

router.post('/checkout', checkout);

module.exports = router;
