const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function testScraperFix() {
    console.log('🔍 Testing scraper fix for match processing...');
    
    const scraper = trackwrestlingScraperService;
    
    try {
        // Test with a single event to see if matches are now processed
        console.log('🏆 Testing with 1 event, 2 teams...');
        
        const results = await scraper.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50',
            headless: true,
            maxEvents: 1,
            maxTeams: 2
        });
        
        console.log('\n📊 Results:');
        console.log(`   Events processed: ${results.eventsProcessed}`);
        console.log(`   Total matches found: ${results.totalMatches}`);
        console.log(`   Matches processed: ${results.processedMatches}`);
        console.log(`   Errors: ${results.errors.length}`);
        
        if (results.errors.length > 0) {
            console.log('\n❌ Errors:');
            results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.type}: ${error.error}`);
            });
        }
        
        if (results.processedMatches > 0) {
            console.log('\n✅ SUCCESS! Matches are now being processed!');
            console.log('🎯 The scraper fix worked!');
        } else {
            console.log('\n❌ Still no matches processed. Need to investigate further.');
        }
        
    } catch (error) {
        console.error('❌ Error testing scraper:', error);
        console.error('Stack trace:', error.stack);
    }
}

testScraperFix();
