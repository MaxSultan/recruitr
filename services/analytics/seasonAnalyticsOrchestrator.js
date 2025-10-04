const seasonRankingRepository = require('../../repositories/seasonRankingRepository');
const eloCalculationService = require('../calculations/eloCalculationService');
const glickoCalculationService = require('../calculations/glickoCalculationService');
const qualityMetricsService = require('../calculations/qualityMetricsService');

/**
 * Orchestrator service for season analytics
 * Single Responsibility: Coordinate analytics calculations and data updates
 */
class SeasonAnalyticsOrchestrator {
  
  /**
   * Calculate comprehensive season analytics
   * @param {number} seasonRankingId - Season ranking ID
   * @returns {Object} Complete analytics object
   */
  async calculateSeasonAnalytics(seasonRankingId) {
    try {
      // Get season ranking with matches
      const seasonRanking = await seasonRankingRepository.findByIdWithMatches(seasonRankingId);
      
      if (!seasonRanking) {
        throw new Error(`SeasonRanking with ID ${seasonRankingId} not found`);
      }

      const matches = seasonRanking.rankingMatches;
      if (matches.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Calculate all analytics using focused services
      const eloAnalytics = eloCalculationService.calculateEloAnalytics(matches);
      const glickoAnalytics = glickoCalculationService.calculateGlickoAnalytics(matches);
      const qualityMetrics = qualityMetricsService.calculateQualityMetrics(matches);
      const basicStats = qualityMetricsService.calculateBasicStats(matches);

      // Combine all analytics
      const analytics = {
        ...basicStats,
        ...eloAnalytics,
        ...glickoAnalytics,
        ...qualityMetrics
      };

      // Update the season ranking with calculated analytics
      await seasonRankingRepository.updateAnalytics(seasonRankingId, analytics);

      return { ...seasonRanking.toJSON(), ...analytics };
    } catch (error) {
      console.error('Error calculating season analytics:', error);
      throw error;
    }
  }

  /**
   * Get season audit trail
   * @param {number} seasonRankingId - Season ranking ID
   * @returns {Object} Audit trail data
   */
  async getSeasonAuditTrail(seasonRankingId) {
    try {
      const seasonRanking = await seasonRankingRepository.findByIdForAuditTrail(seasonRankingId);
      
      if (!seasonRanking) {
        return null;
      }

      return {
        seasonRanking,
        matches: seasonRanking.rankingMatches
      };
    } catch (error) {
      console.error('Error getting season audit trail:', error);
      throw error;
    }
  }

  /**
   * Get empty analytics for seasons with no matches
   * @returns {Object} Empty analytics object
   */
  getEmptyAnalytics() {
    return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      strengthOfSchedule: 0,
      strengthOfRecord: 0,
      strengthOfScheduleAtTime: 0,
      strengthOfScheduleLatest: 0,
      glickoStrengthOfSchedule: 0,
      glickoStrengthOfScheduleAtTime: 0,
      glickoStrengthOfScheduleLatest: 0,
      averageOpponentElo: 0,
      averageOpponentGlicko: 0,
      toughestOpponentElo: 0,
      weakestOpponentElo: 0,
      qualityWins: 0,
      qualityLosses: 0,
      upsetWins: 0,
      upsetLosses: 0
    };
  }

  /**
   * Recalculate analytics for all season rankings
   * @returns {Object} Summary of recalculation results
   */
  async recalculateAllSeasonAnalytics() {
    try {
      const seasonRankingIds = await seasonRankingRepository.getAllIds();
      const results = {
        total: seasonRankingIds.length,
        success: 0,
        failed: 0,
        errors: []
      };

      for (const seasonRankingId of seasonRankingIds) {
        try {
          await this.calculateSeasonAnalytics(seasonRankingId);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            seasonRankingId,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error recalculating all season analytics:', error);
      throw error;
    }
  }
}

module.exports = new SeasonAnalyticsOrchestrator();
