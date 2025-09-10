const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

// Scrape tournament participants data (without saving to database)
router.get('/:tournamentId/participants', tournamentController.getParticipants);

// Scrape tournament participants and save to database
router.post('/scrape', tournamentController.scrapeTournament);

// Get teams for a tournament
router.get('/:tournamentId/teams', tournamentController.getTeams);

module.exports = router;
