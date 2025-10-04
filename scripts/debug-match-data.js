const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');
const trackwrestlingMatchParser = require('../services/parsers/trackwrestlingMatchParser');

const debugMatchData = async () => {
  console.log('🔍 Debugging match data extraction...\n');

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

    // Let's also test the parser directly with some sample data
    console.log('\n🧪 Testing parser with sample data...');
    
    const sampleMatchData = [
      {
        weightClass: '106 lbs',
        matchText: 'John Smith (Utah) over Mike Johnson (Colorado) by Decision 6-4',
        matchHtml: '<td>John Smith (Utah) over Mike Johnson (Colorado) by Decision 6-4</td>'
      }
    ];
    
    const parsedMatches = trackwrestlingMatchParser.parseMatches(sampleMatchData);
    console.log(`✅ Parser test: Found ${parsedMatches.length} parsed matches`);
    
    if (parsedMatches.length > 0) {
      console.log('Sample parsed match:', JSON.stringify(parsedMatches[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error);
    console.error('Stack trace:', error.stack);
  }
};

debugMatchData();
