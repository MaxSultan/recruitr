const { performEloCalculation } = require('./perform-elo-calculation');

describe('performEloCalculation', () => {
  describe('Basic ELO calculation', () => {
    test('should calculate exact ELO ratings for equal players with decision', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'decision'
      });

      // For equal players with decision (k=16, multiplier=1):
      // Expected winner probability = 0.5
      // Winner gain = 16 * (1 - 0.5) = 8
      // Loser loss = 16 * (0 - 0.5) = -8
      expect(result.winnerElo).toBe(1208);
      expect(result.loserElo).toBe(1192);
    });

    test('should calculate exact ELO ratings for equal players with fall', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'fall'
      });

      // For equal players with fall (k=16, multiplier=1.6):
      // Expected winner probability = 0.5
      // Winner gain = 16 * 1.6 * (1 - 0.5) = 12.8
      // Loser loss = 16 * 1.6 * (0 - 0.5) = -12.8
      expect(result.winnerElo).toBe(1212.8);
      expect(result.loserElo).toBe(1187.2);
    });

    test('should calculate exact ELO ratings for higher rated winner', () => {
      const result = performEloCalculation({
        winnerElo: 1400,
        loserElo: 1000,
        result: 'decision'
      });

      // For 1400 vs 1000 with decision (k=16, multiplier=1):
      // Expected winner probability = 1 / (1 + 10^((1000-1400)/400)) = 1 / (1 + 10^(-1)) = 1 / (1 + 0.1) = 0.909
      // Winner gain = 16 * (1 - 0.909) = 16 * 0.091 = 1.456
      // Loser loss = 16 * (0 - 0.091) = -1.456
      expect(result.winnerElo).toBeCloseTo(1401.455, 3);
      expect(result.loserElo).toBeCloseTo(998.545, 3);
    });

    test('should calculate exact ELO ratings for underdog victory', () => {
      const result = performEloCalculation({
        winnerElo: 1000,
        loserElo: 1400,
        result: 'decision'
      });

      // For 1000 vs 1400 with decision (k=16, multiplier=1):
      // Expected winner probability = 1 / (1 + 10^((1400-1000)/400)) = 1 / (1 + 10^1) = 1 / (1 + 10) = 0.091
      // Winner gain = 16 * (1 - 0.091) = 16 * 0.909 = 14.544
      // Loser loss = 16 * (0 - 0.909) = -14.544
      expect(result.winnerElo).toBeCloseTo(1014.545, 3);
      expect(result.loserElo).toBeCloseTo(1385.455, 3);
    });
  });

  describe('Win type multipliers', () => {
    test('should apply exact 1.0 multiplier for decision', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'decision'
      });

      // Decision: k=16, multiplier=1.0
      expect(result.winnerElo).toBe(1208);
      expect(result.loserElo).toBe(1192);
    });

    test('should apply exact 1.2 multiplier for major-decision', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'major-decision'
      });

      // Major decision: k=16, multiplier=1.2
      // Winner gain = 16 * 1.2 * (1 - 0.5) = 9.6
      expect(result.winnerElo).toBe(1209.6);
      expect(result.loserElo).toBe(1190.4);
    });

    test('should apply exact 1.4 multiplier for technical-fall', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'technical-fall'
      });

      // Technical fall: k=16, multiplier=1.4
      // Winner gain = 16 * 1.4 * (1 - 0.5) = 11.2
      expect(result.winnerElo).toBe(1211.2);
      expect(result.loserElo).toBe(1188.8);
    });

    test('should apply exact 1.6 multiplier for fall', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'fall'
      });

      // Fall: k=16, multiplier=1.6
      // Winner gain = 16 * 1.6 * (1 - 0.5) = 12.8
      expect(result.winnerElo).toBe(1212.8);
      expect(result.loserElo).toBe(1187.2);
    });

  });

  describe('Edge cases', () => {
    test('should handle zero ELO ratings', () => {
      const result = performEloCalculation({
        winnerElo: 0,
        loserElo: 0,
        result: 'decision'
      });

      // For equal players at 0 ELO with decision
      expect(result.winnerElo).toBe(8);
      expect(result.loserElo).toBe(-8);
      expect(typeof result.winnerElo).toBe('number');
      expect(typeof result.loserElo).toBe('number');
    });

    test('should handle very high ELO ratings', () => {
      const result = performEloCalculation({
        winnerElo: 3000,
        loserElo: 2500,
        result: 'decision'
      });

      // For 3000 vs 2500 with decision
      // Expected winner probability = 1 / (1 + 10^((2500-3000)/400)) = 1 / (1 + 10^(-1.25)) = 1 / (1 + 0.056) = 0.947
      // Winner gain = 16 * (1 - 0.947) = 0.848
      expect(result.winnerElo).toBeCloseTo(3000.852, 3);
      expect(result.loserElo).toBeCloseTo(2499.148, 3);
      expect(typeof result.winnerElo).toBe('number');
      expect(typeof result.loserElo).toBe('number');
    });

    test('should handle negative ELO ratings', () => {
      const result = performEloCalculation({
        winnerElo: -100,
        loserElo: -200,
        result: 'decision'
      });

      // For -100 vs -200 with decision
      // Expected winner probability = 1 / (1 + 10^((-200-(-100))/400)) = 1 / (1 + 10^(-0.25)) = 1 / (1 + 0.562) = 0.640
      // Winner gain = 16 * (1 - 0.640) = 5.760
      expect(result.winnerElo).toBeCloseTo(-94.241, 3);
      expect(result.loserElo).toBeCloseTo(-205.759, 3);
      expect(typeof result.winnerElo).toBe('number');
      expect(typeof result.loserElo).toBe('number');
    });

  });

  describe('Mathematical accuracy', () => {
    test('should maintain ELO system properties', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'decision'
      });

      // Winner should always gain points
      expect(result.winnerElo).toBeGreaterThan(1200);
      
      // Loser should always lose points
      expect(result.loserElo).toBeLessThan(1200);
      
      // Total points should be conserved (approximately)
      const totalChange = (result.winnerElo - 1200) + (result.loserElo - 1200);
      expect(Math.abs(totalChange)).toBeLessThan(0.01);
    });

    test('should return valid numbers', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'decision'
      });

      expect(typeof result.winnerElo).toBe('number');
      expect(typeof result.loserElo).toBe('number');
      expect(Number.isFinite(result.winnerElo)).toBe(true);
      expect(Number.isFinite(result.loserElo)).toBe(true);
      expect(Number.isNaN(result.winnerElo)).toBe(false);
      expect(Number.isNaN(result.loserElo)).toBe(false);
    });
  });

  describe('Return value structure', () => {
    test('should return object with correct properties', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'decision'
      });

      expect(result).toHaveProperty('winnerElo');
      expect(result).toHaveProperty('loserElo');
      expect(Object.keys(result)).toHaveLength(2);
    });

    test('should return new ELO values as numbers', () => {
      const result = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'decision'
      });

      expect(typeof result.winnerElo).toBe('number');
      expect(typeof result.loserElo).toBe('number');
    });
  });

  describe('Real wrestling scenarios', () => {
    test('should handle championship match: 1600 vs 1550 with fall', () => {
      const result = performEloCalculation({
        winnerElo: 1600,
        loserElo: 1550,
        result: 'fall'
      });

      // Championship match with fall victory
      // Expected winner probability = 1 / (1 + 10^((1550-1600)/400)) = 1 / (1 + 10^(-0.125)) = 1 / (1 + 0.749) = 0.572
      // Winner gain = 16 * 1.6 * (1 - 0.572) = 25.6 * 0.428 = 10.957
      // Loser loss = 16 * 1.6 * (0 - 0.428) = 25.6 * -0.428 = -10.957
      expect(result.winnerElo).toBeCloseTo(1610.971, 3);
      expect(result.loserElo).toBeCloseTo(1539.029, 3);
    });

    test('should handle upset victory: 800 vs 1200 with technical-fall', () => {
      const result = performEloCalculation({
        winnerElo: 800,
        loserElo: 1200,
        result: 'technical-fall'
      });

      // Major upset with technical fall
      // Expected winner probability = 1 / (1 + 10^((1200-800)/400)) = 1 / (1 + 10^1) = 1 / (1 + 10) = 0.091
      // Winner gain = 16 * 1.4 * (1 - 0.091) = 22.4 * 0.909 = 20.362
      expect(result.winnerElo).toBeCloseTo(820.364, 3);
      expect(result.loserElo).toBeCloseTo(1179.636, 3);
    });

    test('should handle close match: 1100 vs 1120 with major-decision', () => {
      const result = performEloCalculation({
        winnerElo: 1100,
        loserElo: 1120,
        result: 'major-decision'
      });

      // Close match with major decision
      // Expected winner probability = 1 / (1 + 10^((1120-1100)/400)) = 1 / (1 + 10^0.05) = 1 / (1 + 1.122) = 0.471
      // Winner gain = 16 * 1.2 * (1 - 0.471) = 19.2 * 0.529 = 10.157
      expect(result.winnerElo).toBeCloseTo(1110.152, 3);
      expect(result.loserElo).toBeCloseTo(1109.848, 3);
    });
  });

  describe('Win type comparison', () => {
    test('should give exact point differences for different win types', () => {
      const decisionResult = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'decision'
      });

      const majorDecisionResult = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'major-decision'
      });

      const technicalFallResult = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'technical-fall'
      });

      const fallResult = performEloCalculation({
        winnerElo: 1200,
        loserElo: 1200,
        result: 'fall'
      });

      // Verify exact point gains
      expect(decisionResult.winnerElo).toBe(1208);        // +8
      expect(majorDecisionResult.winnerElo).toBe(1209.6);  // +9.6
      expect(technicalFallResult.winnerElo).toBe(1211.2);  // +11.2
      expect(fallResult.winnerElo).toBe(1212.8);          // +12.8

      // Verify exact point losses
      expect(decisionResult.loserElo).toBe(1192);        // -8
      expect(majorDecisionResult.loserElo).toBe(1190.4);  // -9.6
      expect(technicalFallResult.loserElo).toBe(1188.8);  // -11.2
      expect(fallResult.loserElo).toBe(1187.2);          // -12.8
    });
  });
});
