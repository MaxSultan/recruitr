const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

const testUtahScraper = async () => {
  console.log('🚀 Testing Utah 2024-25 Men\'s Wrestling Scraper...\n');

  try {
    const results = await trackwrestlingScraperService.scrapeMatches({
      targetSeason: '2024-25 High School Boys',
      stateId: '50', // Utah
      headless: false, // Show browser for debugging
      maxEvents: 1,
      maxTeams: 1
    });

    console.log('\n📊 Scraping Results:');
    console.log(`Total Events: ${results.totalEvents}`);
    console.log(`Total Teams: ${results.totalTeams}`);
    console.log(`Total Matches: ${results.totalMatches}`);
    console.log(`Processed Matches: ${results.processedMatches}`);
    console.log(`Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.type}: ${error.error}`);
      });
    }

    if (results.matches.length > 0) {
      console.log('\n✅ Sample Matches:');
      results.matches.slice(0, 3).forEach((match, index) => {
        console.log(`${index + 1}. ${match.winner.fullName} over ${match.loser.fullName} (${match.match.result.type})`);
      });
    }

  } catch (error) {
    console.error('❌ Scraper test failed:', error);
    console.error('Stack trace:', error.stack);
  }
};

testUtahScraper();
