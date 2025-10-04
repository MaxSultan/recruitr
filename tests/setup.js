// Jest setup file for API testing
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/recruitr_test';
process.env.DB_NAME = 'recruitr_test';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';

// Global test utilities
global.testUtils = {
  // Helper to create test database connection
  createTestConnection: async () => {
    const { Sequelize } = require('sequelize');
    const testDbUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
    const sequelize = new Sequelize(testDbUrl);
    
    try {
      await sequelize.authenticate();
      console.log('✅ Test database connection established');
      return sequelize;
    } catch (error) {
      console.error('❌ Unable to connect to test database:', error);
      throw error;
    }
  },
  
  // Helper to clean up test data
  cleanupTestData: async () => {
    const { Season, Athlete } = require('../models');
    
    try {
      // Clear all test data (in reverse order due to foreign keys)
      await Season.destroy({ where: {}, force: true });
      await Athlete.destroy({ where: {}, force: true });
      console.log('🧹 Test data cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
      throw error;
    }
  },
  
  // Helper to create test athlete
  createTestAthlete: async (data = {}) => {
    const { Athlete } = require('../models');
    
    const defaultData = {
      firstName: 'Test',
      lastName: 'Athlete',
      state: 'UT',
      isFavorite: false,
      ...data
    };
    
    return await Athlete.create(defaultData);
  },
  
  // Helper to create test season
  createTestSeason: async (athleteId, data = {}) => {
    const { Season } = require('../models');
    
    const defaultData = {
      athleteId,
      year: '2025',
      weightClass: '150',
      division: '5A',
      team: 'Test High School',
      wins: 10,
      losses: 5,
      statePlacement: '3rd',
      pointsScored: 25.5,
      tournamentId: 'TEST123',
      grade: '11',
      ...data
    };
    
    return await Season.create(defaultData);
  }
};

// Setup and teardown hooks
beforeAll(async () => {
  console.log('🚀 Setting up test environment...');
});

afterAll(async () => {
  console.log('🏁 Cleaning up test environment...');
});

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
