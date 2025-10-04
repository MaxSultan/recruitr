const express = require('express');
const seasonAnalyticsController = require('../controllers/seasonAnalyticsController');

const router = express.Router();

// Get audit trail for a specific season
router.get('/:seasonRankingId/audit-trail', seasonAnalyticsController.getSeasonAuditTrail);

// Get analytics for a specific season
router.get('/:seasonRankingId/analytics', seasonAnalyticsController.getSeasonAnalytics);

// Get analytics summary for multiple seasons
router.get('/summary', seasonAnalyticsController.getAnalyticsSummary);

// Get strength of schedule comparison
router.get('/sos-comparison', seasonAnalyticsController.compareStrengthOfSchedule);

// Recalculate analytics for all seasons
router.post('/recalculate-all', seasonAnalyticsController.recalculateAllSeasonAnalytics);

module.exports = router;
