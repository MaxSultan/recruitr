/**
 * Global Jest Teardown
 * Runs once after all tests complete
 */

module.exports = async () => {
  console.log('🧹 Global test teardown starting...');
  
  try {
    // Clean up any remaining test data
    const { Season, Athlete } = require('../models');
    
    if (Season && Athlete) {
      await Season.destroy({ where: {}, force: true });
      await Athlete.destroy({ where: {}, force: true });
      console.log('✅ Test data cleaned up');
    }
    
    // Clear global test environment
    global.testEnvironmentReady = false;
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
  
  console.log('🎉 Global test teardown complete');
};
