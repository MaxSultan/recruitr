const { performGlickoCalculation } = require('./perform-glicko-calculation');

/**
 * Example Glicko calculation for two athletes
 * 
 * Glicko system uses:
 * - Rating (R): Current skill level (typically 1500)
 * - Rating Deviation (RD): Uncertainty in rating (typically 350)
 * - Volatility (σ): How much the rating fluctuates over time
 * 
 * This example calculates the rating change after a match between two wrestlers
 */

// Example athletes with Glicko ratings
const athlete1 = {
  id: 1,
  name: "John Smith",
  rating: 1500,      // Current rating
  rd: 200,           // Rating deviation
  volatility: 0.06   // Volatility
};

const athlete2 = {
  id: 2,
  name: "Mike Johnson", 
  rating: 1400,      // Current rating
  rd: 180,           // Rating deviation
  volatility: 0.05   // Volatility
};

// Match result: athlete1 wins by decision
const matchResult = {
  winner: athlete1.id,
  loser: athlete2.id,
  result: 'decision',  // 'decision', 'major-decision', 'technical-fall', 'fall'
  matchDate: new Date()
};

console.log('🏆 Glicko Rating Calculation Example');
console.log('=====================================\n');

console.log('📊 BEFORE MATCH:');
console.log(`Winner: ${athlete1.name}`);
console.log(`  Rating: ${athlete1.rating}`);
console.log(`  RD: ${athlete1.rd}`);
console.log(`  Volatility: ${athlete1.volatility}`);
console.log('');

console.log(`Loser: ${athlete2.name}`);
console.log(`  Rating: ${athlete2.rating}`);
console.log(`  RD: ${athlete2.rd}`);
console.log(`  Volatility: ${athlete2.volatility}`);
console.log('');

// Calculate new Glicko ratings
const result = performGlickoCalculation(athlete1, athlete2, matchResult);

console.log('📈 AFTER MATCH:');
console.log(`Winner: ${athlete1.name}`);
console.log(`  New Rating: ${result.winner.newRating.toFixed(2)}`);
console.log(`  New RD: ${result.winner.newRd.toFixed(2)}`);
console.log(`  New Volatility: ${result.winner.newVolatility.toFixed(4)}`);
console.log(`  Rating Change: ${(result.winner.newRating - athlete1.rating).toFixed(2)}`);
console.log('');

console.log(`Loser: ${athlete2.name}`);
console.log(`  New Rating: ${result.loser.newRating.toFixed(2)}`);
console.log(`  New RD: ${result.loser.newRd.toFixed(2)}`);
console.log(`  New Volatility: ${result.loser.newVolatility.toFixed(4)}`);
console.log(`  Rating Change: ${(result.loser.newRating - athlete2.rating).toFixed(2)}`);
console.log('');

// Calculate win probability before match
const winProbability = 1 / (1 + Math.pow(10, -((athlete1.rating - athlete2.rating) / 400)));
console.log(`📊 Win Probability: ${athlete1.name} had ${(winProbability * 100).toFixed(1)}% chance to win`);
console.log('');

// Show different scenarios
console.log('🎯 DIFFERENT WIN TYPES:');
console.log('======================');

const winTypes = ['decision', 'major-decision', 'technical-fall', 'fall'];

winTypes.forEach(winType => {
  const scenarioResult = performGlickoCalculation(
    { ...athlete1 }, 
    { ...athlete2 }, 
    { ...matchResult, result: winType }
  );
  
  const ratingChange = scenarioResult.winner.newRating - athlete1.rating;
  console.log(`${winType.padEnd(15)}: +${ratingChange.toFixed(2)} rating points`);
});

console.log('\n✨ Glicko system provides more accurate ratings than ELO by considering:');
console.log('   • Rating Deviation (uncertainty)');
console.log('   • Volatility (rating stability)');
console.log('   • Time since last match');
console.log('   • Number of matches played');
