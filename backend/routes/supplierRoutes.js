const express = require("express");
const router = express.Router();
const {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.use(verifyToken);

router.get("/", getSuppliers);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

module.exports = router;
