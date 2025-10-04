#!/usr/bin/env node

/**
 * Test Database Setup Script
 * Creates and configures the test database for Jest tests
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function setupTestDatabase() {
  console.log('🧪 Setting up test database...');
  
  // Test database configuration
  const testDbName = 'recruitr_test';
  const testDbUrl = process.env.TEST_DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${testDbName}`;
  
  // Connect to postgres database to create test database
  const adminDbUrl = `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/postgres`;
  
  try {
    // Connect to admin database
    const adminSequelize = new Sequelize(adminDbUrl, {
      logging: false
    });
    
    await adminSequelize.authenticate();
    console.log('✅ Connected to PostgreSQL admin database');
    
    // Create test database if it doesn't exist
    try {
      await adminSequelize.query(`CREATE DATABASE ${testDbName}`);
      console.log(`✅ Created test database: ${testDbName}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Test database ${testDbName} already exists`);
      } else if (error.message.includes('permission denied')) {
        console.log(`⚠️  Permission denied to create database. Please create '${testDbName}' manually:`);
        console.log(`   psql -U postgres -c "CREATE DATABASE ${testDbName};"`);
        console.log(`   Or run: createdb ${testDbName}`);
        console.log(`   Continuing with existing database...`);
      } else {
        throw error;
      }
    }
    
    await adminSequelize.close();
    
    // Connect to test database and sync models
    const testSequelize = new Sequelize(testDbUrl, {
      logging: false
    });
    
    await testSequelize.authenticate();
    console.log('✅ Connected to test database');
    
    // Import models and sync
    const { Athlete, Season } = require('../models');
    
    // Drop and recreate tables
    await Season.drop({ cascade: true, force: true });
    await Athlete.drop({ cascade: true, force: true });
    console.log('🗑️  Dropped existing test tables');
    
    // Create tables
    await Athlete.sync({ force: true });
    await Season.sync({ force: true });
    console.log('✅ Created test tables');
    
    await testSequelize.close();
    console.log('🎉 Test database setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };
