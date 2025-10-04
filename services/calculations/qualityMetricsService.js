/**
 * Service responsible for quality metrics calculations
 * Single Responsibility: Handle quality wins, upsets, and opponent analysis
 */
class QualityMetricsService {
  
  /**
   * Calculate quality metrics for a set of matches
   * @param {Array} matches - Array of RankingMatch objects
   * @returns {Object} Quality metrics
   */
  calculateQualityMetrics(matches) {
    let qualityWins = 0;
    let qualityLosses = 0;
    let upsetWins = 0;
    let upsetLosses = 0;

    matches.forEach(match => {
      const opponentElo = match.opponentEloAtTime || match.opponentEloBefore || 1500;
      const athleteElo = match.athleteEloAtTime || match.athleteEloBefore || 1500;
      const isWin = match.matchResult === 'win';

      // Quality wins/losses (opponent strength thresholds)
      if (isWin && opponentElo > 1600) qualityWins++;
      if (!isWin && opponentElo < 1400) qualityLosses++;

      // Upsets (beating someone higher rated or losing to someone lower rated)
      if (isWin && opponentElo > athleteElo) upsetWins++;
      if (!isWin && opponentElo < athleteElo) upsetLosses++;
    });

    return { qualityWins, qualityLosses, upsetWins, upsetLosses };
  }

  /**
   * Calculate opponent analysis metrics
   * @param {Array} matches - Array of RankingMatch objects
   * @returns {Object} Opponent analysis
   */
  calculateOpponentAnalysis(matches) {
    const uniqueOpponents = new Set(matches.map(m => m.opponentId));
    
    return {
      uniqueOpponentsFaced: uniqueOpponents.size,
      averageMatchesPerOpponent: matches.length / uniqueOpponents.size,
      mostFrequentOpponent: this.findMostFrequentOpponent(matches)
    };
  }

  /**
   * Find the opponent faced most frequently
   * @param {Array} matches - Array of RankingMatch objects
   * @returns {Object|null} Most frequent opponent data
   */
  findMostFrequentOpponent(matches) {
    const opponentCounts = {};
    matches.forEach(match => {
      const opponentId = match.opponentId;
      opponentCounts[opponentId] = (opponentCounts[opponentId] || 0) + 1;
    });

    const mostFrequent = Object.entries(opponentCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return mostFrequent ? {
      opponentId: parseInt(mostFrequent[0]),
      matchCount: mostFrequent[1]
    } : null;
  }

  /**
   * Calculate basic match statistics
   * @param {Array} matches - Array of RankingMatch objects
   * @returns {Object} Basic match statistics
   */
  calculateBasicStats(matches) {
    return {
      totalMatches: matches.length,
      wins: matches.filter(m => m.matchResult === 'win').length,
      losses: matches.filter(m => m.matchResult === 'loss').length
    };
  }
}

module.exports = new QualityMetricsService();
