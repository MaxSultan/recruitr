const { SeasonRanking, RankingMatch, Athlete } = require('../models');

/**
 * Repository responsible for SeasonRanking data access
 * Single Responsibility: Handle all SeasonRanking database operations
 */
class SeasonRankingRepository {
  
  /**
   * Find season ranking by ID with matches and opponents
   * @param {number} seasonRankingId - Season ranking ID
   * @returns {Object|null} Season ranking with matches and opponents
   */
  async findByIdWithMatches(seasonRankingId) {
    return await SeasonRanking.findByPk(seasonRankingId, {
      include: [{
        model: RankingMatch,
        as: 'rankingMatches',
        include: [{
          model: Athlete,
          as: 'opponent',
          attributes: ['id', 'firstName', 'lastName']
        }],
        order: [['matchDate', 'ASC']]
      }]
    });
  }

  /**
   * Find season ranking by ID with matches and opponents (for audit trail)
   * @param {number} seasonRankingId - Season ranking ID
   * @returns {Object|null} Season ranking with matches and opponents for audit trail
   */
  async findByIdForAuditTrail(seasonRankingId) {
    return await SeasonRanking.findByPk(seasonRankingId, {
      include: [{
        model: RankingMatch,
        as: 'rankingMatches',
        include: [{
          model: Athlete,
          as: 'opponent',
          attributes: ['id', 'firstName', 'lastName', 'state']
        }],
        order: [['matchDate', 'ASC']]
      }]
    });
  }

  /**
   * Update season ranking analytics
   * @param {number} seasonRankingId - Season ranking ID
   * @param {Object} analytics - Analytics data to update
   * @returns {Promise} Update result
   */
  async updateAnalytics(seasonRankingId, analytics) {
    const updateData = {
      strengthOfSchedule: analytics.strengthOfSchedule,
      strengthOfRecord: analytics.strengthOfRecord,
      strengthOfScheduleAtTime: analytics.strengthOfScheduleAtTime,
      strengthOfScheduleLatest: analytics.strengthOfScheduleLatest,
      glickoStrengthOfSchedule: analytics.glickoStrengthOfSchedule,
      glickoStrengthOfScheduleAtTime: analytics.glickoStrengthOfScheduleAtTime,
      glickoStrengthOfScheduleLatest: analytics.glickoStrengthOfScheduleLatest,
      averageOpponentElo: analytics.averageOpponentElo,
      averageOpponentGlicko: analytics.averageOpponentGlicko,
      toughestOpponentElo: analytics.toughestOpponentElo,
      weakestOpponentElo: analytics.weakestOpponentElo,
      qualityWins: analytics.qualityWins,
      qualityLosses: analytics.qualityLosses,
      upsetWins: analytics.upsetWins,
      upsetLosses: analytics.upsetLosses
    };

    return await SeasonRanking.update(updateData, {
      where: { id: seasonRankingId }
    });
  }

  /**
   * Find season rankings with filters
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Array} Season rankings
   */
  async findByFilters(filters, options = {}) {
    const whereClause = {};
    if (filters.athleteId) whereClause.athleteId = filters.athleteId;
    if (filters.year) whereClause.year = filters.year;
    if (filters.weightClass) whereClause.weightClass = filters.weightClass;
    if (filters.team) whereClause.team = filters.team;
    if (filters.division) whereClause.division = filters.division;

    const queryOptions = {
      where: whereClause,
      order: options.order || [['year', 'DESC']],
      limit: options.limit,
      include: options.include
    };

    return await SeasonRanking.findAll(queryOptions);
  }

  /**
   * Get all season ranking IDs
   * @returns {Array} Array of season ranking IDs
   */
  async getAllIds() {
    const seasonRankings = await SeasonRanking.findAll({
      attributes: ['id']
    });
    return seasonRankings.map(sr => sr.id);
  }

  /**
   * Find season ranking by ID only
   * @param {number} seasonRankingId - Season ranking ID
   * @returns {Object|null} Season ranking
   */
  async findById(seasonRankingId) {
    return await SeasonRanking.findByPk(seasonRankingId);
  }
}

module.exports = new SeasonRankingRepository();
