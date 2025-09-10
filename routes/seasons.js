const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');

// Get a single season by ID
router.get('/:seasonId', seasonController.getSeasonById);

// Update an existing season
router.put('/:seasonId', seasonController.updateSeason);

// Delete a season
router.delete('/:seasonId', seasonController.deleteSeason);

module.exports = router;
