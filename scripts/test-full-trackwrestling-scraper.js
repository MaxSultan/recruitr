const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function testFullScraper() {
  console.log('🚀 Testing TrackWrestling scraper with pagination (3 events, 5 teams each)...');
  
  try {
    const results = await trackwrestlingScraperService.scrapeMatches({
      targetSeason: '2024-25 High School Boys',
      stateId: '50', // Utah
      headless: true,
      maxEvents: 3, // Process 3 events to test pagination
      maxTeams: 5   // Process 5 teams per event
    });
    
    console.log('\n✅ Full scraper test completed!');
    console.log('📊 Final Results:');
    console.log(`  Total Events: ${results.totalEvents}`);
    console.log(`  Total Teams: ${results.totalTeams}`);
    console.log(`  Total Matches: ${results.totalMatches}`);
    console.log(`  Processed Matches: ${results.processedMatches}`);
    console.log(`  Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.type}: ${error.error}`);
      });
    }
    
    if (results.matches.length > 0) {
      console.log('\n🎯 Sample processed matches:');
      results.matches.slice(0, 3).forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.winnerFirstName} ${match.winnerLastName} over ${match.loserFirstName} ${match.loserLastName} (${match.result})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Full scraper test failed:', error);
  }
}

testFullScraper();
