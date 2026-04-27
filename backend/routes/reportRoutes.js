const express = require('express');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/financial', reportController.financial);

module.exports = router;
