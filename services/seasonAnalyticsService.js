const seasonAnalyticsOrchestrator = require('./analytics/seasonAnalyticsOrchestrator');

/**
 * Service for calculating season analytics including strength of schedule
 * This service now delegates to focused services following SRP
 */
class SeasonAnalyticsService {
  
  /**
   * Calculate comprehensive strength of schedule analytics for a season
   * @param {number} seasonRankingId - ID of the SeasonRanking record
   * @returns {Object} Analytics object with all calculated metrics
   */
  async calculateSeasonAnalytics(seasonRankingId) {
    return await seasonAnalyticsOrchestrator.calculateSeasonAnalytics(seasonRankingId);
  }

  /**
   * Get season audit trail with all matches and rating evolution
   * @param {number} seasonRankingId - ID of the SeasonRanking record
   * @returns {Object} Audit trail object with season and matches
   */
  async getSeasonAuditTrail(seasonRankingId) {
    return await seasonAnalyticsOrchestrator.getSeasonAuditTrail(seasonRankingId);
  }

  /**
   * Recalculate analytics for all season rankings
   * @returns {Object} Summary of recalculation results
   */
  async recalculateAllSeasonAnalytics() {
    return await seasonAnalyticsOrchestrator.recalculateAllSeasonAnalytics();
  }
}

module.exports = new SeasonAnalyticsService();