/**
 * Global Jest Setup
 * Runs once before all tests
 */

const { setupTestDatabase } = require('../scripts/setup-test-db');

module.exports = async () => {
  console.log('🚀 Global test setup starting...');
  
  try {
    // Ensure test database is set up
    await setupTestDatabase();
    console.log('✅ Test database ready');
    
    // Set global test environment
    global.testEnvironmentReady = true;
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
  
  console.log('🎉 Global test setup complete');
};
