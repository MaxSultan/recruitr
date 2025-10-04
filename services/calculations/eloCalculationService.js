const { performEloCalculation } = require('../../utilities/perform-elo-calculation');

/**
 * Service responsible for ELO rating calculations
 * Single Responsibility: Handle all ELO-related calculations
 */
class EloCalculationService {
  
  /**
   * Calculate ELO analytics for a set of matches
   * @param {Array} matches - Array of RankingMatch objects
   * @returns {Object} ELO-based analytics
   */
  calculateEloAnalytics(matches) {
    const eloRatings = matches.map(m => m.opponentEloAtTime || m.opponentEloBefore || 1500);
    const currentEloRatings = matches.map(m => m.opponentCurrentElo || m.opponentEloAfter || 1500);
    
    return {
      strengthOfSchedule: this.calculateAverage(eloRatings),
      strengthOfScheduleLatest: this.calculateAverage(currentEloRatings),
      strengthOfScheduleAtTime: this.calculateAverage(eloRatings),
      averageOpponentElo: this.calculateAverage(eloRatings),
      toughestOpponentElo: Math.max(...eloRatings),
      weakestOpponentElo: Math.min(...eloRatings),
      strengthOfRecord: this.calculateStrengthOfRecord(matches, 'elo')
    };
  }

  /**
   * Calculate strength of record - weighted performance based on opponent quality
   * @param {Array} matches - Array of RankingMatch objects
   * @param {string} ratingType - Type of rating to use ('elo' or 'glicko')
   * @returns {number} Strength of record value
   */
  calculateStrengthOfRecord(matches, ratingType = 'elo') {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    matches.forEach(match => {
      const opponentRating = ratingType === 'elo' 
        ? (match.opponentEloAtTime || match.opponentEloBefore || 1500)
        : (match.opponentGlickoAtTime || match.opponentGlickoBefore || 1500);
      
      const isWin = match.matchResult === 'win';
      const resultWeight = isWin ? 1 : 0;
      
      // Weight by opponent strength (higher rated opponents matter more)
      const opponentWeight = (opponentRating - 1000) / 1000; // Normalize around 1000-2000 range
      
      totalWeightedScore += resultWeight * opponentWeight;
      totalWeight += opponentWeight;
    });

    return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 2000 : 1500;
  }

  /**
   * Calculate average of an array of numbers
   * @param {Array} numbers - Array of numbers
   * @returns {number} Average value
   */
  calculateAverage(numbers) {
    return numbers.length > 0 ? numbers.reduce((sum, num) => sum + num, 0) / numbers.length : 0;
  }

  /**
   * Calculate ELO change for a match result using existing utility
   * @param {Object} matchData - Match data object with winnerElo, loserElo, result
   * @returns {Object} ELO calculation result
   */
  calculateEloChange(matchData) {
    const { winnerElo, loserElo, result } = matchData;
    return performEloCalculation({ winnerElo, loserElo, result });
  }
}

module.exports = new EloCalculationService();
