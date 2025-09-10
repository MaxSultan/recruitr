const express = require('express');
const router = express.Router();
const athleteController = require('../controllers/athleteController');

// Search athletes by name
router.get('/search', athleteController.searchAthletes);

// Get athlete by ID with all seasons
router.get('/:id', athleteController.getAthleteById);

// Toggle athlete favorite status
router.patch('/:id/favorite', athleteController.toggleFavorite);

// Create a new season for an athlete
router.post('/:athleteId/seasons', athleteController.createSeason);

// Merge two athletes
router.post('/merge', athleteController.mergeAthletes);

module.exports = router;
