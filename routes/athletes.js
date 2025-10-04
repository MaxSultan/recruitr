const express = require('express');
const router = express.Router();
const athleteController = require('../controllers/athleteController');

// Search athletes by name
router.get('/search', athleteController.searchAthletes);

// Get athlete by ID with all seasons
router.get('/:id', athleteController.getAthleteById);

// Get athlete ranking matches (audit trail)
router.get('/:id/ranking-matches', athleteController.getAthleteRankingMatches);

// Get athlete ranking audit page
router.get('/:id/ranking_audit', athleteController.getAthleteRankingAuditPage);

// Toggle athlete favorite status
router.patch('/:id/favorite', athleteController.toggleFavorite);

// Create a new season for an athlete
router.post('/:athleteId/seasons', athleteController.createSeason);

// Merge two athletes
router.post('/merge', athleteController.mergeAthletes);

module.exports = router;
