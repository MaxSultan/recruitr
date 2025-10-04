const { performGlickoCalculation } = require('../../utilities/perform-glicko-calculation');

/**
 * Service responsible for Glicko rating calculations
 * Single Responsibility: Handle all Glicko-related calculations
 */
class GlickoCalculationService {
  
  /**
   * Calculate Glicko analytics for a set of matches
   * @param {Array} matches - Array of RankingMatch objects
   * @returns {Object} Glicko-based analytics
   */
  calculateGlickoAnalytics(matches) {
    const glickoRatings = matches.map(m => m.opponentGlickoAtTime || m.opponentGlickoBefore || 1500);
    const currentGlickoRatings = matches.map(m => m.opponentCurrentGlicko || m.opponentGlickoAfter || 1500);
    
    return {
      glickoStrengthOfSchedule: this.calculateAverage(glickoRatings),
      glickoStrengthOfScheduleLatest: this.calculateAverage(currentGlickoRatings),
      glickoStrengthOfScheduleAtTime: this.calculateAverage(glickoRatings),
      averageOpponentGlicko: this.calculateAverage(glickoRatings)
    };
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
   * Calculate Glicko rating change for a match using existing utility
   * @param {Object} winner - Winner data with rating, rd, volatility
   * @param {Object} loser - Loser data with rating, rd, volatility
   * @param {string} result - Match result type
   * @returns {Object} Glicko calculation result
   */
  calculateGlickoChange(winner, loser, result) {
    return performGlickoCalculation(winner, loser, result);
  }
}

module.exports = new GlickoCalculationService();
