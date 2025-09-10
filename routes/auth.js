const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Get authentication session for a tournament
router.get('/:tournamentId', authController.getAuthSession);

module.exports = router;
