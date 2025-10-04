const { performGlickoCalculation } = require('./perform-glicko-calculation');

describe('Glicko Rating System', () => {
  describe('Basic Match Calculations', () => {
    test('should calculate rating changes for a standard match', () => {
      const winner = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const loser = {
        rating: 1400,
        rd: 180,
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(winner, loser, matchResult);
      
      // Winner should gain rating points
      expect(result.winner.newRating).toBeGreaterThan(winner.rating);
      expect(result.winner.newRating).toBeCloseTo(1580.36, 1);
      
      // Loser should lose rating points
      expect(result.loser.newRating).toBeLessThan(loser.rating);
      expect(result.loser.newRating).toBeCloseTo(1316.92, 1);
      
      // RD should decrease for both players (confidence increased)
      expect(result.winner.newRd).toBeLessThan(winner.rd);
      expect(result.loser.newRd).toBeLessThan(loser.rd);
      
      // Volatility should remain approximately the same (simplified implementation)
      expect(result.winner.newVolatility).toBeCloseTo(winner.volatility, 10);
      expect(result.loser.newVolatility).toBeCloseTo(loser.volatility, 10);
    });

    test('should handle equal rated players', () => {
      const player1 = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const player2 = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(player1, player2, matchResult);
      
      // Winner should gain rating points
      expect(result.winner.newRating).toBeGreaterThan(1500);
      expect(result.winner.newRating).toBeCloseTo(1602.88, 1);
      
      // Loser should lose rating points
      expect(result.loser.newRating).toBeLessThan(1500);
      expect(result.loser.newRating).toBeCloseTo(1397.12, 1);
      
      // Rating changes should be equal and opposite
      const winnerChange = result.winner.newRating - 1500;
      const loserChange = result.loser.newRating - 1500;
      expect(Math.abs(winnerChange + loserChange)).toBeLessThan(1);
    });

    test('should handle high RD (uncertain) players with larger rating changes', () => {
      const uncertainWinner = {
        rating: 1500,
        rd: 350, // High uncertainty
        volatility: 0.06
      };
      
      const certainLoser = {
        rating: 1400,
        rd: 100, // Low uncertainty
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(uncertainWinner, certainLoser, matchResult);
      
      // Uncertain winner should get larger rating change
      const winnerChange = result.winner.newRating - uncertainWinner.rating;
      expect(winnerChange).toBeGreaterThan(50); // Should be substantial
      
      // RD should decrease for uncertain player
      expect(result.winner.newRd).toBeLessThan(uncertainWinner.rd);
    });
  });

  describe('Win Type Multipliers', () => {
    test('should apply correct multipliers for different win types', () => {
      const winner = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const loser = {
        rating: 1400,
        rd: 180,
        volatility: 0.05
      };
      
      const winTypes = [
        { result: 'decision', expectedMultiplier: 1.0 },
        { result: 'major-decision', expectedMultiplier: 1.1 },
        { result: 'technical-fall', expectedMultiplier: 1.2 },
        { result: 'fall', expectedMultiplier: 1.3 }
      ];
      
      const results = winTypes.map(winType => {
        return performGlickoCalculation(winner, loser, winType.result);
      });
      
      // Technical fall should have larger rating change than decision
      const decisionChange = results[0].winner.newRating - winner.rating;
      const techFallChange = results[2].winner.newRating - winner.rating;
      expect(techFallChange).toBeGreaterThan(decisionChange);
      
      // Fall should have largest rating change
      const fallChange = results[3].winner.newRating - winner.rating;
      expect(fallChange).toBeGreaterThan(techFallChange);
      
      // Major decision should be between decision and technical fall
      const majorDecisionChange = results[1].winner.newRating - winner.rating;
      expect(majorDecisionChange).toBeGreaterThan(decisionChange);
      expect(majorDecisionChange).toBeLessThan(techFallChange);
    });

    test('should handle unknown win type with default multiplier', () => {
      const winner = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const loser = {
        rating: 1400,
        rd: 180,
        volatility: 0.05
      };
      
      const matchResult =  'unknown-type';
      
      const result = performGlickoCalculation(winner, loser, matchResult);
      
      // Should use default multiplier of 1.0
      expect(result.winner.newRating).toBeGreaterThan(winner.rating);
      expect(result.loser.newRating).toBeLessThan(loser.rating);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very low ratings', () => {
      const winner = {
        rating: 800,
        rd: 200,
        volatility: 0.06
      };
      
      const loser = {
        rating: 700,
        rd: 180,
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(winner, loser, matchResult);
      
      // Should still produce valid results
      expect(result.winner.newRating).toBeGreaterThan(winner.rating);
      expect(result.loser.newRating).toBeLessThan(loser.rating);
      expect(result.winner.newRd).toBeGreaterThan(0);
      expect(result.loser.newRd).toBeGreaterThan(0);
    });

    test('should handle very high ratings', () => {
      const winner = {
        rating: 2500,
        rd: 200,
        volatility: 0.06
      };
      
      const loser = {
        rating: 2400,
        rd: 180,
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(winner, loser, matchResult);
      
      // Should still produce valid results
      expect(result.winner.newRating).toBeGreaterThan(winner.rating);
      expect(result.loser.newRating).toBeLessThan(loser.rating);
      expect(result.winner.newRd).toBeGreaterThan(0);
      expect(result.loser.newRd).toBeGreaterThan(0);
    });

    test('should handle very low RD (high confidence)', () => {
      const winner = {
        rating: 1500,
        rd: 50, // Very low uncertainty
        volatility: 0.06
      };
      
      const loser = {
        rating: 1400,
        rd: 50, // Very low uncertainty
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(winner, loser, matchResult);
      
      // Should produce smaller rating changes due to high confidence
      const winnerChange = result.winner.newRating - winner.rating;
      const loserChange = result.loser.newRating - loser.rating;
      
      expect(Math.abs(winnerChange)).toBeLessThan(80);
      expect(Math.abs(loserChange)).toBeLessThan(80);
    });

    test('should handle very high RD (low confidence)', () => {
      const winner = {
        rating: 1500,
        rd: 400, // Very high uncertainty
        volatility: 0.06
      };
      
      const loser = {
        rating: 1400,
        rd: 400, // Very high uncertainty
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(winner, loser, matchResult);
      
      // Should produce larger rating changes due to low confidence
      const winnerChange = result.winner.newRating - winner.rating;
      const loserChange = result.loser.newRating - loser.rating;
      
      expect(Math.abs(winnerChange)).toBeGreaterThan(50);
      expect(Math.abs(loserChange)).toBeGreaterThan(50);
    });
  });

  describe('Mathematical Properties', () => {
    test('should maintain conservation of rating points approximately', () => {
      const winner = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const loser = {
        rating: 1400,
        rd: 180,
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(winner, loser, matchResult);
      
      // Total rating change should be approximately zero (conservation)
      const totalChange = (result.winner.newRating - winner.rating) + (result.loser.newRating - loser.rating);
      expect(Math.abs(totalChange)).toBeLessThan(10); // Allow some tolerance
    });

    test('should always decrease RD after a match', () => {
      const winner = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const loser = {
        rating: 1400,
        rd: 180,
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(winner, loser, matchResult);
      
      // RD should always decrease (confidence increases)
      expect(result.winner.newRd).toBeLessThan(winner.rd);
      expect(result.loser.newRd).toBeLessThan(loser.rd);
    });

    test('should produce consistent results for same inputs', () => {
      const winner = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const loser = {
        rating: 1400,
        rd: 180,
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result1 = performGlickoCalculation(winner, loser, matchResult);
      const result2 = performGlickoCalculation(winner, loser, matchResult);
      
      // Results should be identical
      expect(result1.winner.newRating).toBeCloseTo(result2.winner.newRating, 10);
      expect(result1.loser.newRating).toBeCloseTo(result2.loser.newRating, 10);
      expect(result1.winner.newRd).toBeCloseTo(result2.winner.newRd, 10);
      expect(result1.loser.newRd).toBeCloseTo(result2.loser.newRd, 10);
    });
  });

  describe('Expected Score Calculations', () => {
    test('should calculate reasonable win probabilities', () => {
      const higherRated = {
        rating: 1600,
        rd: 200,
        volatility: 0.06
      };
      
      const lowerRated = {
        rating: 1400,
        rd: 200,
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(higherRated, lowerRated, matchResult);
      
      // Higher rated player should gain rating points and lower rated player should lose rating points
      const winnerGain = result.winner.newRating - higherRated.rating;
      const loserLoss = lowerRated.rating - result.loser.newRating;
      expect(winnerGain).toBeGreaterThan(0);
      expect(loserLoss).toBeGreaterThan(0);
    });

    test('should handle equal ratings with balanced rating changes', () => {
      const player1 = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const player2 = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(player1, player2, matchResult);
      
      // Rating changes should be approximately equal and opposite
      const winnerChange = result.winner.newRating - 1500;
      const loserChange = result.loser.newRating - 1500;
      expect(Math.abs(winnerChange + loserChange)).toBeLessThan(5);
    });
  });

  describe('Return Value Structure', () => {
    test('should return correct structure', () => {
      const winner = {
        rating: 1500,
        rd: 200,
        volatility: 0.06
      };
      
      const loser = {
        rating: 1400,
        rd: 180,
        volatility: 0.05
      };
      
      const matchResult = 'decision';
      
      const result = performGlickoCalculation(winner, loser, matchResult);
      
      // Should have correct structure
      expect(result).toHaveProperty('winner');
      expect(result).toHaveProperty('loser');
      expect(result).toHaveProperty('match');
      
      // Winner should have all required properties
      expect(result.winner).toHaveProperty('newRating');
      expect(result.winner).toHaveProperty('newRd');
      expect(result.winner).toHaveProperty('newVolatility');
      expect(result.winner).toHaveProperty('ratingChange');
      expect(result.winner).toHaveProperty('rdChange');
      
      // Loser should have all required properties
      expect(result.loser).toHaveProperty('newRating');
      expect(result.loser).toHaveProperty('newRd');
      expect(result.loser).toHaveProperty('newVolatility');
      expect(result.loser).toHaveProperty('ratingChange');
      expect(result.loser).toHaveProperty('rdChange');
      
      // Match should have result and multiplier
      expect(result.match).toHaveProperty('result');
      expect(result.match).toHaveProperty('multiplier');
      expect(typeof result.match.multiplier).toBe('number');
    });
  });
});
