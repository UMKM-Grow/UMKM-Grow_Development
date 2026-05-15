const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, memberController.createMember);
router.get('/', verifyToken, memberController.getAllMembers);
router.get('/search', verifyToken, memberController.getMemberByPhone);
router.get('/:id', verifyToken, memberController.getMemberById);
router.put('/:id', verifyToken, memberController.updateMember);
router.post('/add-points', verifyToken, memberController.addPoints);

module.exports = router;
