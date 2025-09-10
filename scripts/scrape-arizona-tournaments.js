#!/usr/bin/env node

/**
 * Arizona Wrestling Tournament Scraper
 * Scrapes all Arizona state wrestling tournaments for multiple years and divisions
 */

require('dotenv').config();
const axios = require('axios');

// Tournament data from the provided list
const tournaments = [
  // 2025 Tournaments
  { state: 'AZ', year: '2025', division: 'D1-D4', tournamentId: '853651132' },

  
  // 2024 Tournaments
  { state: 'AZ', year: '2024', division: 'D1-D4', tournamentId: '770562132' },

  
  // 2023 Tournaments
  { state: 'AZ', year: '2023', division: 'D1-D4', tournamentId: '678239132' },

  
  // 2022 Tournaments
  { state: 'AZ', year: '2022', division: 'D1-D4', tournamentId: '631911132' },

];

// API base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Scrape a single tournament
 */
async function scrapeTournament(tournament) {
  try {
    console.log(`🏆 Scraping ${tournament.state} ${tournament.year} ${tournament.division} (ID: ${tournament.tournamentId})...`);
    
    const response = await axios.post(`${API_BASE_URL}/tournament/scrape`, {
      tournamentId: tournament.tournamentId,
      year: tournament.year,
      state: tournament.state
    });
    
    if (response.data.success) {
      console.log(`✅ Success: ${response.data.data.savedCount} new seasons, ${response.data.data.skippedCount} updated`);
      return {
        success: true,
        tournament: `${tournament.state} ${tournament.year} ${tournament.division}`,
        saved: response.data.data.savedCount,
        skipped: response.data.data.skippedCount,
        total: response.data.data.totalParticipants
      };
    } else {
      console.log(`❌ Failed: ${response.data.error}`);
      return {
        success: false,
        tournament: `${tournament.state} ${tournament.year} ${tournament.division}`,
        error: response.data.error
      };
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return {
      success: false,
      tournament: `${tournament.state} ${tournament.year} ${tournament.division}`,
      error: error.message
    };
  }
}

/**
 * Add delay between requests to be respectful to the server
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main scraping function
 */
async function scrapeAllTournaments() {
  console.log('🚀 Starting Arizona Wrestling Tournament Scraping...');
  console.log(`📊 Total tournaments to scrape: ${tournaments.length}`);
  console.log('=' * 60);
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  let totalSaved = 0;
  let totalSkipped = 0;
  let totalParticipants = 0;
  
  for (let i = 0; i < tournaments.length; i++) {
    const tournament = tournaments[i];
    console.log(`\n[${i + 1}/${tournaments.length}] Processing ${tournament.state} ${tournament.year} ${tournament.division}...`);
    
    const result = await scrapeTournament(tournament);
    results.push(result);
    
    if (result.success) {
      successCount++;
      totalSaved += result.saved || 0;
      totalSkipped += result.skipped || 0;
      totalParticipants += result.total || 0;
    } else {
      failureCount++;
    }
    
    // Add delay between requests (except for the last one)
    if (i < tournaments.length - 1) {
      console.log('⏳ Waiting 2 seconds before next tournament...');
      await delay(2000);
    }
  }
  
  // Print summary
  console.log('\n' + '=' * 60);
  console.log('📈 SCRAPING SUMMARY');
  console.log('=' * 60);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📊 Total Participants Processed: ${totalParticipants}`);
  console.log(`💾 New Seasons Created: ${totalSaved}`);
  console.log(`🔄 Existing Seasons Updated: ${totalSkipped}`);
  
  // Print detailed results
  console.log('\n📋 DETAILED RESULTS:');
  console.log('-' * 60);
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const details = result.success 
      ? `Saved: ${result.saved}, Updated: ${result.skipped}, Total: ${result.total}`
      : `Error: ${result.error}`;
    
    console.log(`${status} ${result.tournament} - ${details}`);
  });
  
  // Print failed tournaments
  const failedTournaments = results.filter(r => !r.success);
  if (failedTournaments.length > 0) {
    console.log('\n❌ FAILED TOURNAMENTS:');
    console.log('-' * 60);
    failedTournaments.forEach(result => {
      console.log(`❌ ${result.tournament} - ${result.error}`);
    });
  }
  
  console.log('\n🎉 Arizona tournament scraping completed!');
  return results;
}

/**
 * Check if the API server is running
 */
async function checkServerHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.data.status === 'OK') {
      console.log('✅ API server is running and healthy');
      return true;
    } else {
      console.log('❌ API server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to API server. Make sure the server is running on port 3000');
    console.log('   Start the server with: npm start or npm run dev');
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🏆 Arizona Wrestling Tournament Scraper');
  console.log('=====================================\n');
  
  // Check server health
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }
  
  // Confirm before starting
  console.log(`\n📋 About to scrape ${tournaments.length} Arizona wrestling tournaments:`);
  tournaments.forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.state} ${t.year} ${t.division} (ID: ${t.tournamentId})`);
  });
  
  console.log('\n⚠️  This will take several minutes and will make many API requests.');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  // Wait 5 seconds for user to cancel
  await delay(5000);
  
  // Start scraping
  try {
    await scrapeAllTournaments();
  } catch (error) {
    console.error('💥 Fatal error during scraping:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Scraping interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Scraping terminated');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { scrapeAllTournaments, scrapeTournament, tournaments };
