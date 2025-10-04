const express = require('express');
const router = express.Router();
const trackwrestlingController = require('../controllers/trackwrestlingController');

/**
 * TrackWrestling scraping routes
 */

// POST /api/trackwrestling/scrape - Scrape matches from TrackWrestling
router.post('/scrape', trackwrestlingController.scrapeMatches);

// GET /api/trackwrestling/status - Get scraping status
router.get('/status', trackwrestlingController.getScrapingStatus);

// GET /api/trackwrestling/test-browser - Test browser connection
router.get('/test-browser', trackwrestlingController.testBrowser);

// POST /api/trackwrestling/parse-match - Parse match text (for testing)
router.post('/parse-match', trackwrestlingController.parseMatch);

module.exports = router;
