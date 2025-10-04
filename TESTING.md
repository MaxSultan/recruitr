# Testing Setup Guide

This guide explains how to set up and run tests for the Recruitr application.

## Test Database Setup

The tests use a separate test database to avoid interfering with your development data.

### 1. Create Test Database

First, create a test database in PostgreSQL:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE recruitr_test;

# Exit psql
\q
```

### 2. Configure Test Environment

Create a `.env.test` file (optional) or set environment variables:

```bash
# Option 1: Environment variables
export TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/recruitr_test"

# Option 2: Individual settings
export DB_NAME="recruitr_test"
export DB_USER="postgres"
export DB_PASSWORD="your_password"
export DB_HOST="localhost"
export DB_PORT="5432"
```

### 3. Setup Test Database

Run the test database setup script:

```bash
npm run test:setup
```

This will:
- Create the test database (if it doesn't exist)
- Drop and recreate all tables
- Set up the proper schema

## Running Tests

### Available Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose

# Setup test database and run tests
npm run test:all
```

### Test Structure

```
tests/
├── setup.js              # Jest setup file
├── config.js             # Test configuration
├── global-setup.js       # Global test setup
└── global-teardown.js    # Global test teardown

services/
└── perform-elo-calculation.test.js  # Example test file
```

## Writing Tests

### Example Test File

```javascript
const { performEloCalculation } = require('./perform-elo-calculation');

describe('performEloCalculation', () => {
  test('should calculate new ELO ratings', () => {
    const result = performEloCalculation({
      winnerElo: 1200,
      loserElo: 1200,
      result: 'decision'
    });

    expect(result.winnerElo).toBeGreaterThan(1200);
    expect(result.loserElo).toBeLessThan(1200);
  });
});
```

### Database Tests

For tests that need database access:

```javascript
const { Athlete, Season } = require('../models');

describe('Athlete Service', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await global.testUtils.cleanupTestData();
  });

  test('should create athlete', async () => {
    const athlete = await global.testUtils.createTestAthlete({
      firstName: 'John',
      lastName: 'Doe',
      state: 'UT'
    });

    expect(athlete.firstName).toBe('John');
    expect(athlete.state).toBe('UT');
  });
});
```

## Test Utilities

The test setup provides several utilities:

- `global.testUtils.createTestConnection()` - Create test database connection
- `global.testUtils.cleanupTestData()` - Clean up test data
- `global.testUtils.createTestAthlete(data)` - Create test athlete
- `global.testUtils.createTestSeason(athleteId, data)` - Create test season

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure PostgreSQL is running
   - Check database credentials
   - Verify test database exists

2. **Permission Errors**
   - Ensure your user has CREATE DATABASE privileges
   - Check database user permissions

3. **Port Conflicts**
   - Tests use port 3001 by default
   - Change `TEST_PORT` environment variable if needed

### Reset Test Database

If tests are failing due to database issues:

```bash
# Drop and recreate test database
psql -U postgres -c "DROP DATABASE IF EXISTS recruitr_test;"
psql -U postgres -c "CREATE DATABASE recruitr_test;"
npm run test:setup
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD

## CI/CD Integration

For continuous integration, ensure:

1. Test database is created in CI environment
2. Environment variables are set correctly
3. Database cleanup happens between test runs

Example GitHub Actions step:

```yaml
- name: Setup Test Database
  run: |
    createdb recruitr_test
    npm run test:setup
  env:
    TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/recruitr_test
```
