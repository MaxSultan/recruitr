const auditTrailController = require('./analytics/auditTrailController');
const analyticsController = require('./analytics/analyticsController');
const comparisonController = require('./analytics/comparisonController');

/**
 * Main controller for season analytics endpoints
 * This controller delegates to focused controllers following SRP
 */
class SeasonAnalyticsController {
  
  /**
   * Get audit trail for a specific season
   * GET /api/season-analytics/:seasonRankingId/audit-trail
   */
  async getSeasonAuditTrail(req, res, next) {
    return auditTrailController.getAuditTrail(req, res, next);
  }

  /**
   * Calculate and get analytics for a specific season
   * GET /api/season-analytics/:seasonRankingId/analytics
   */
  async getSeasonAnalytics(req, res, next) {
    return analyticsController.getSeasonAnalytics(req, res, next);
  }

  /**
   * Recalculate analytics for all seasons
   * POST /api/season-analytics/recalculate-all
   */
  async recalculateAllSeasonAnalytics(req, res, next) {
    return analyticsController.recalculateAllAnalytics(req, res, next);
  }

  /**
   * Get analytics summary for multiple seasons
   * GET /api/season-analytics/summary?athleteId=123&year=2024
   */
  async getAnalyticsSummary(req, res, next) {
    return comparisonController.getAnalyticsSummary(req, res, next);
  }

  /**
   * Get strength of schedule comparison across athletes
   * GET /api/season-analytics/sos-comparison?year=2024&weightClass=145&limit=50
   */
  async compareStrengthOfSchedule(req, res, next) {
    return comparisonController.getStrengthOfScheduleComparison(req, res, next);
  }
}

module.exports = new SeasonAnalyticsController();