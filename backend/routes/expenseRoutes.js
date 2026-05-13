const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { listExpenses, createExpense, uploadsDir } = require('../controllers/expenseController');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch {
      return cb(new Error('Failed to prepare uploads directory'));
    }
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

const router = express.Router();

router.get('/', listExpenses);
router.post('/', upload.single('bukti'), createExpense);

module.exports = router;
