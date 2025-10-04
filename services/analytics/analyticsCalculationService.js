const eloCalculationService = require('../calculations/eloCalculationService');
const glickoCalculationService = require('../calculations/glickoCalculationService');
const qualityMetricsService = require('../calculations/qualityMetricsService');

/**
 * Service responsible for analytics calculations
 * Single Responsibility: Calculate and format analytics data
 */
class AnalyticsCalculationService {
  
  /**
   * Calculate comprehensive analytics for a set of matches
   * @param {Array} matches - Array of RankingMatch objects
   * @returns {Object} Complete analytics object
   */
  calculateComprehensiveAnalytics(matches) {
    if (!matches || matches.length === 0) {
      return this.getEmptyAnalytics();
    }

    // Use focused services for calculations
    const basicStats = qualityMetricsService.calculateBasicStats(matches);
    const eloAnalytics = eloCalculationService.calculateEloAnalytics(matches);
    const glickoAnalytics = glickoCalculationService.calculateGlickoAnalytics(matches);
    const qualityMetrics = qualityMetricsService.calculateQualityMetrics(matches);
    const opponentAnalysis = qualityMetricsService.calculateOpponentAnalysis(matches);

    // Combine all analytics
    return {
      ...basicStats,
      ...eloAnalytics,
      ...glickoAnalytics,
      ...qualityMetrics,
      ...opponentAnalysis
    };
  }

  /**
   * Calculate analytics for multiple seasons (comparison)
   * @param {Array} seasonRankings - Array of season ranking objects with matches
   * @returns {Object} Comparative analytics
   */
  calculateComparativeAnalytics(seasonRankings) {
    const results = {
      totalSeasons: seasonRankings.length,
      averageStrengthOfSchedule: 0,
      strongestSchedule: null,
      weakestSchedule: null,
      seasonComparisons: []
    };

    let totalSOS = 0;
    let maxSOS = 0;
    let minSOS = Infinity;

    seasonRankings.forEach(season => {
      const analytics = this.calculateComprehensiveAnalytics(season.rankingMatches);
      
      totalSOS += analytics.strengthOfSchedule || 0;
      
      if (analytics.strengthOfSchedule > maxSOS) {
        maxSOS = analytics.strengthOfSchedule;
        results.strongestSchedule = {
          seasonId: season.id,
          athleteId: season.athleteId,
          strengthOfSchedule: analytics.strengthOfSchedule
        };
      }
      
      if (analytics.strengthOfSchedule < minSOS) {
        minSOS = analytics.strengthOfSchedule;
        results.weakestSchedule = {
          seasonId: season.id,
          athleteId: season.athleteId,
          strengthOfSchedule: analytics.strengthOfSchedule
        };
      }

      results.seasonComparisons.push({
        seasonId: season.id,
        athleteId: season.athleteId,
        analytics
      });
    });

    results.averageStrengthOfSchedule = seasonRankings.length > 0 ? totalSOS / seasonRankings.length : 0;

    return results;
  }

  /**
   * Format analytics for API response
   * @param {Object} analytics - Raw analytics object
   * @returns {Object} Formatted analytics for API
   */
  formatAnalyticsForAPI(analytics) {
    return {
      basic: {
        totalMatches: analytics.totalMatches || 0,
        wins: analytics.wins || 0,
        losses: analytics.losses || 0,
        winPercentage: analytics.totalMatches > 0 ? (analytics.wins / analytics.totalMatches) : 0
      },
      strengthOfSchedule: {
        elo: {
          average: Math.round((analytics.strengthOfSchedule || 0) * 100) / 100,
          atTime: Math.round((analytics.strengthOfScheduleAtTime || 0) * 100) / 100,
          latest: Math.round((analytics.strengthOfScheduleLatest || 0) * 100) / 100
        },
        glicko: {
          average: Math.round((analytics.glickoStrengthOfSchedule || 0) * 100) / 100,
          atTime: Math.round((analytics.glickoStrengthOfScheduleAtTime || 0) * 100) / 100,
          latest: Math.round((analytics.glickoStrengthOfScheduleLatest || 0) * 100) / 100
        }
      },
      opponentAnalysis: {
        averageElo: Math.round((analytics.averageOpponentElo || 0) * 100) / 100,
        averageGlicko: Math.round((analytics.averageOpponentGlicko || 0) * 100) / 100,
        toughestElo: analytics.toughestOpponentElo || 0,
        weakestElo: analytics.weakestOpponentElo || 0,
        uniqueOpponents: analytics.uniqueOpponentsFaced || 0
      },
      qualityMetrics: {
        qualityWins: analytics.qualityWins || 0,
        qualityLosses: analytics.qualityLosses || 0,
        upsetWins: analytics.upsetWins || 0,
        upsetLosses: analytics.upsetLosses || 0
      }
    };
  }

  /**
   * Get empty analytics object
   * @returns {Object} Empty analytics
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
      upsetLosses: 0,
      uniqueOpponentsFaced: 0
    };
  }
}

module.exports = new AnalyticsCalculationService();
