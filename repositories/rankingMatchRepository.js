const { RankingMatch } = require('../models');

/**
 * Repository responsible for RankingMatch data access
 * Single Responsibility: Handle all RankingMatch database operations
 */
class RankingMatchRepository {
  
  /**
   * Create a new ranking match
   * @param {Object} matchData - Match data
   * @returns {Object} Created ranking match
   */
  async create(matchData) {
    return await RankingMatch.create(matchData);
  }

  /**
   * Find ranking matches by season ranking ID
   * @param {number} seasonRankingId - Season ranking ID
   * @param {Object} options - Query options
   * @returns {Array} Ranking matches
   */
  async findBySeasonRankingId(seasonRankingId, options = {}) {
    const queryOptions = {
      where: { seasonRankingId },
      order: options.order || [['matchDate', 'ASC']]
    };

    if (options.include) {
      queryOptions.include = options.include;
    }

    return await RankingMatch.findAll(queryOptions);
  }

  /**
   * Find ranking match by hash (for deduplication)
   * @param {string} matchHash - Match hash
   * @returns {Object|null} Ranking match
   */
  async findByHash(matchHash) {
    return await RankingMatch.findOne({
      where: { matchHash }
    });
  }

  /**
   * Check if match hash exists
   * @param {string} matchHash - Match hash
   * @returns {boolean} True if hash exists
   */
  async hashExists(matchHash) {
    const match = await this.findByHash(matchHash);
    return match !== null;
  }

  /**
   * Delete ranking matches by season ranking ID
   * @param {number} seasonRankingId - Season ranking ID
   * @returns {Promise} Delete result
   */
  async deleteBySeasonRankingId(seasonRankingId) {
    return await RankingMatch.destroy({
      where: { seasonRankingId }
    });
  }

  /**
   * Get match statistics for a season
   * @param {number} seasonRankingId - Season ranking ID
   * @returns {Object} Match statistics
   */
  async getMatchStats(seasonRankingId) {
    const matches = await this.findBySeasonRankingId(seasonRankingId);
    
    const wins = matches.filter(m => m.matchResult === 'win').length;
    const losses = matches.filter(m => m.matchResult === 'loss').length;
    const uniqueOpponents = new Set(matches.map(m => m.opponentId)).size;

    return {
      totalMatches: matches.length,
      wins,
      losses,
      uniqueOpponents,
      winPercentage: matches.length > 0 ? wins / matches.length : 0
    };
  }
}

module.exports = new RankingMatchRepository();
