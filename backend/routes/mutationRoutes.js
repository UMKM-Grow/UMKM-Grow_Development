const express = require('express');
const mutationController = require('../controllers/mutationController');

const router = express.Router();

// Create stock mutation
router.post('/', mutationController.createMutation);

// Get mutation history (with optional branch_id filter)
router.get('/', mutationController.getMutationHistory);

// Get mutation by ID
router.get('/:id', mutationController.getMutationById);

module.exports = router;
