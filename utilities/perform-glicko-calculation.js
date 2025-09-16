/**
 * Glicko Rating System Implementation
 * 
 * The Glicko system is an improvement over ELO that includes:
 * - Rating (R): Current skill level
 * - Rating Deviation (RD): Uncertainty in rating
 * - Volatility (σ): How much the rating fluctuates over time
 * 
 * This provides more accurate ratings, especially for new players
 * and those who haven't played recently.
 */

const performGlickoCalculation = (winner, loser, result) => {
  // Glicko system constants
  const q = Math.log(10) / 400;  // Standard Glicko scaling factor
  const pi = Math.PI;
  
  // Win type multipliers (more conservative than ELO)
  const winTypeMultiplier = {
    'decision': 1.0,
    'major-decision': 1.1,
    'technical-fall': 1.2,
    'fall': 1.3
  };
  
  const multiplier = winTypeMultiplier[result] || 1.0;
  
  // Conservative scaling factor for rating changes
  const conservativeScale = 0.25;
  
  // Step 1: Convert ratings to Glicko scale
  const glicko = (rd) => 1 / Math.sqrt(1 + 3 * q * q * rd * rd / (pi * pi));
  
  // Step 2: Calculate expected score for winner
  const expectedScore = (rating1, rating2, rd2) => {
    return 1 / (1 + Math.pow(10, -glicko(rd2) * (rating1 - rating2) / 400));
  };
  
  // Step 3: Calculate variance and delta for winner
  const winnerG = glicko(loser.rd);
  const winnerExpected = expectedScore(winner.rating, loser.rating, loser.rd);
  const winnerVariance = 1 / (q * q * winnerG * winnerG * winnerExpected * (1 - winnerExpected));
  const winnerDelta = q * winnerG * (1 - winnerExpected) * multiplier;
  
  // Step 4: Calculate variance and delta for loser
  const loserG = glicko(winner.rd);
  const loserExpected = expectedScore(loser.rating, winner.rating, winner.rd);
  const loserVariance = 1 / (q * q * loserG * loserG * loserExpected * (1 - loserExpected));
  const loserDelta = q * loserG * (0 - loserExpected) * multiplier;
  
  // Step 5: Update ratings with conservative scaling
  const newWinnerRating = winner.rating + winnerDelta * winnerVariance * conservativeScale;
  const newWinnerRd = Math.sqrt(1 / (1 / (winner.rd * winner.rd) + 1 / winnerVariance));
  
  const newLoserRating = loser.rating + loserDelta * loserVariance * conservativeScale;
  const newLoserRd = Math.sqrt(1 / (1 / (loser.rd * loser.rd) + 1 / loserVariance));
  
  // Step 7: Update volatility (simplified - in practice this is more complex)
  const updateVolatility = (volatility, rd, delta, variance) => {
    // Simplified volatility update
    const change = Math.abs(delta) / variance;
    return Math.max(0.01, Math.min(0.5, volatility * (1 + change * 0.01)));
  };
  
  const newWinnerVolatility = updateVolatility(winner.volatility, winner.rd, winnerDelta, winnerVariance);
  const newLoserVolatility = updateVolatility(loser.volatility, loser.rd, loserDelta, loserVariance);
  
  return {
    winner: {
      id: winner.id,
      name: winner.name,
      oldRating: winner.rating,
      oldRd: winner.rd,
      oldVolatility: winner.volatility,
      newRating: newWinnerRating,
      newRd: newWinnerRd,
      newVolatility: newWinnerVolatility,
      ratingChange: newWinnerRating - winner.rating,
      rdChange: newWinnerRd - winner.rd
    },
    loser: {
      id: loser.id,
      name: loser.name,
      oldRating: loser.rating,
      oldRd: loser.rd,
      oldVolatility: loser.volatility,
      newRating: newLoserRating,
      newRd: newLoserRd,
      newVolatility: newLoserVolatility,
      ratingChange: newLoserRating - loser.rating,
      rdChange: newLoserRd - loser.rd
    },
    match: {
      result,
      multiplier: multiplier,
    }
  };
};

module.exports = { performGlickoCalculation };