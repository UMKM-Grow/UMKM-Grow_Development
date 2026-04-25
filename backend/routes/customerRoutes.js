const express = require('express');
const { listCustomers } = require('../controllers/customerController');

const router = express.Router();

router.get('/', listCustomers);

module.exports = router;
