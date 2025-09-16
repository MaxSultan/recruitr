/**
 * Test Environment Configuration
 * This file contains test-specific database and environment settings
 */

module.exports = {
  // Test database configuration
  testDatabase: {
    name: 'recruitr_test',
    url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/recruitr_test',
    options: {
      logging: false,
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: 'recruitr_test',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    }
  },
  
  // Test environment settings
  environment: {
    NODE_ENV: 'test',
    PORT: process.env.TEST_PORT || 3001
  },
  
  // Test data settings
  testData: {
    cleanupAfterTests: true,
    seedData: true
  }
};
