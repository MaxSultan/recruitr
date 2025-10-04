module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/migrations/**',
    '!**/scripts/**'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout (for API tests that might take longer)
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Module paths
  moduleDirectories: ['node_modules', 'src'],
  
  // Transform files (if needed for ES6+)
  transform: {},
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/migrations/',
    '/scripts/'
  ],
  
  // Environment variables for tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Global setup and teardown
  // globalSetup: '<rootDir>/tests/global-setup.js',
  // globalTeardown: '<rootDir>/tests/global-teardown.js'
};
