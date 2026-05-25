const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();

router.get("/financial", reportController.financial);
router.get("/tax", reportController.getTaxReport);

module.exports = router;
