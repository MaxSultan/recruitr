#!/usr/bin/env node

/**
 * TrackWrestling Scraper Cron Job
 * 
 * This script runs the TrackWrestling scraper according to the ELO ranking system flowchart.
 * It can be run manually or scheduled as a cron job.
 * 
 * Usage:
 *   node scripts/run-trackwrestling-scraper.js
 *   node scripts/run-trackwrestling-scraper.js --state utah
 *   node scripts/run-trackwrestling-scraper.js --season 2024-2025
 */

const path = require('path');
const TrackWrestlingScraper = require('../services/trackwrestling-scraper');
const { syncDatabase } = require('../models');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  options[key] = value;
}

async function main() {
  console.log('🚀 Starting TrackWrestling Scraper...');
  console.log('📅 Started at:', new Date().toISOString());
  
  try {
    // Ensure database is up to date
    console.log('🗄️  Checking database...');
    await syncDatabase(false);
    
    // Initialize scraper
    const scraper = new TrackWrestlingScraper();
    
    // Override state if specified
    if (options.state) {
      const stateMap = {
        'utah': 'Utah High School Activities Association',
        'colorado': 'Colorado High School Activities Association',
        'arizona': 'Arizona Interscholastic Association',
        'idaho': 'Idaho High School Activities Association',
        'nevada': 'Nevada Interscholastic Activities Association'
      };
      
      if (stateMap[options.state.toLowerCase()]) {
        scraper.targetState = stateMap[options.state.toLowerCase()];
        console.log(`🎯 Targeting state: ${scraper.targetState}`);
      } else {
        console.error(`❌ Unknown state: ${options.state}`);
        console.error('Available states: utah, colorado, arizona, idaho, nevada');
        process.exit(1);
      }
    }
    
    // Override season if specified
    if (options.season) {
      scraper.targetSeason = options.season;
      console.log(`📅 Targeting season: ${scraper.targetSeason}`);
    }
    
    // Run the scraper
    await scraper.run();
    
    console.log('✅ Scraper completed successfully');
    console.log('📊 Summary:');
    console.log(`   - Matches processed: ${scraper.processedMatches.size}`);
    console.log(`   - Athletes updated: ${scraper.athletesUpdated || 0}`);
    console.log(`   - Errors encountered: ${scraper.errors || 0}`);
    
  } catch (error) {
    console.error('❌ Scraper failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
  
  console.log('🏁 Finished at:', new Date().toISOString());
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main };
