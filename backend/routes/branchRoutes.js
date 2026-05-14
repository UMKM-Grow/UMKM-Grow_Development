const express = require('express');
const branchController = require('../controllers/branchController');

const router = express.Router();

router.get('/users', branchController.listUsers);
router.get('/', branchController.listBranches);
router.post('/', branchController.createBranch);
router.put('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

module.exports = router;
