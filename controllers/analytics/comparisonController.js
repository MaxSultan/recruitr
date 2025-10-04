const seasonRankingRepository = require('../../repositories/seasonRankingRepository');
const analyticsCalculationService = require('../../services/analytics/analyticsCalculationService');

/**
 * Controller responsible for analytics comparisons and summaries
 * Single Responsibility: Handle comparison and summary requests
 */
class ComparisonController {
  
  /**
   * Get analytics summary for multiple seasons
   * GET /api/season-analytics/summary?athleteId=123&year=2024
   */
  async getAnalyticsSummary(req, res) {
    try {
      const { athleteId, year, weightClass, team } = req.query;
      
      const filters = {};
      if (athleteId) filters.athleteId = parseInt(athleteId);
      if (year) filters.year = parseInt(year);
      if (weightClass) filters.weightClass = weightClass;
      if (team) filters.team = team;

      const seasons = await seasonRankingRepository.findByFilters(filters, {
        order: [['year', 'DESC']],
        include: [{
          model: require('../../models').Athlete,
          as: 'athlete',
          attributes: ['id', 'firstName', 'lastName', 'state']
        }]
      });

      // Calculate summary statistics
      const summary = this.calculateSummaryStatistics(seasons);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      res.status(500).json({
        error: 'Failed to get analytics summary',
        message: error.message
      });
    }
  }

  /**
   * Get strength of schedule comparison across athletes
   * GET /api/season-analytics/sos-comparison?year=2024&weightClass=145&limit=50
   */
  async getStrengthOfScheduleComparison(req, res) {
    try {
      const { year, weightClass, division, team, limit = 50 } = req.query;
      
      const filters = {};
      if (year) filters.year = parseInt(year);
      if (weightClass) filters.weightClass = weightClass;
      if (division) filters.division = division;
      if (team) filters.team = team;

      const seasons = await seasonRankingRepository.findByFilters(filters, {
        order: [
          ['strengthOfSchedule', 'DESC'],
          ['finalElo', 'DESC']
        ],
        limit: parseInt(limit),
        include: [{
          model: require('../../models').Athlete,
          as: 'athlete',
          attributes: ['id', 'firstName', 'lastName', 'state']
        }]
      });

      const comparison = this.formatComparisonData(seasons);

      res.json({
        success: true,
        data: {
          totalResults: seasons.length,
          comparison
        }
      });
    } catch (error) {
      console.error('Error getting strength of schedule comparison:', error);
      res.status(500).json({
        error: 'Failed to get strength of schedule comparison',
        message: error.message
      });
    }
  }

  /**
   * Calculate summary statistics for multiple seasons
   * @param {Array} seasons - Array of season ranking objects
   * @returns {Object} Summary statistics
   */
  calculateSummaryStatistics(seasons) {
    return {
      totalSeasons: seasons.length,
      totalMatches: seasons.reduce((sum, season) => sum + (season.totalMatches || 0), 0),
      totalWins: seasons.reduce((sum, season) => sum + season.wins, 0),
      totalLosses: seasons.reduce((sum, season) => sum + season.losses, 0),
      averageStrengthOfSchedule: this.calculateAverage(seasons.map(s => s.strengthOfSchedule).filter(Boolean)),
      averageStrengthOfRecord: this.calculateAverage(seasons.map(s => s.strengthOfRecord).filter(Boolean)),
      peakElo: Math.max(...seasons.map(s => s.finalElo || 0)),
      currentElo: seasons.length > 0 ? seasons[0].finalElo : null,
      currentGlicko: seasons.length > 0 ? seasons[0].finalGlickoRating : null,
      totalQualityWins: seasons.reduce((sum, season) => sum + season.qualityWins, 0),
      totalUpsetWins: seasons.reduce((sum, season) => sum + season.upsetWins, 0),
      seasons: seasons.map(season => this.formatSeasonData(season))
    };
  }

  /**
   * Format comparison data for API response
   * @param {Array} seasons - Array of season ranking objects
   * @returns {Array} Formatted comparison data
   */
  formatComparisonData(seasons) {
    return seasons.map(season => ({
      id: season.id,
      athlete: {
        id: season.athlete.id,
        name: `${season.athlete.firstName} ${season.athlete.lastName}`,
        state: season.athlete.state
      },
      season: {
        year: season.year,
        weightClass: season.weightClass,
        team: season.team,
        division: season.division,
        record: `${season.wins}-${season.losses}`
      },
      ratings: {
        finalElo: season.finalElo,
        finalGlicko: season.finalGlickoRating
      },
      strengthOfSchedule: {
        average: season.strengthOfSchedule,
        latest: season.strengthOfScheduleLatest,
        record: season.strengthOfRecord,
        glicko: season.glickoStrengthOfSchedule,
        glickoLatest: season.glickoStrengthOfScheduleLatest
      },
      opponents: {
        averageElo: season.averageOpponentElo,
        averageGlicko: season.averageOpponentGlicko,
        toughestElo: season.toughestOpponentElo,
        weakestElo: season.weakestOpponentElo
      },
      quality: {
        qualityWins: season.qualityWins,
        qualityLosses: season.qualityLosses,
        upsetWins: season.upsetWins,
        upsetLosses: season.upsetLosses
      },
      totalMatches: season.totalMatches
    }));
  }

  /**
   * Format individual season data
   * @param {Object} season - Season ranking object
   * @returns {Object} Formatted season data
   */
  formatSeasonData(season) {
    return {
      id: season.id,
      year: season.year,
      weightClass: season.weightClass,
      team: season.team,
      division: season.division,
      record: `${season.wins}-${season.losses}`,
      finalElo: season.finalElo,
      finalGlickoRating: season.finalGlickoRating,
      finalGlickoRd: season.finalGlickoRd,
      strengthOfSchedule: season.strengthOfSchedule,
      strengthOfRecord: season.strengthOfRecord,
      strengthOfScheduleLatest: season.strengthOfScheduleLatest,
      averageOpponentElo: season.averageOpponentElo,
      toughestOpponentElo: season.toughestOpponentElo,
      qualityWins: season.qualityWins,
      upsetWins: season.upsetWins,
      totalMatches: season.totalMatches,
      seasonSpan: {
        firstMatch: season.firstMatchDate,
        lastMatch: season.lastMatchDate
      }
    };
  }

  /**
   * Helper method to calculate average
   * @param {Array} numbers - Array of numbers
   * @returns {number|null} Average or null if no valid numbers
   */
  calculateAverage(numbers) {
    const validNumbers = numbers.filter(n => n !== null && n !== undefined && !isNaN(n));
    return validNumbers.length > 0 
      ? validNumbers.reduce((sum, num) => sum + num, 0) / validNumbers.length 
      : null;
  }
}

module.exports = new ComparisonController();
