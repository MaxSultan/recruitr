const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function testFixedScraper() {
    console.log('🔧 Testing fixed match detection scraper...');
    console.log('📊 This should now properly filter out tournament names and only find actual matches');
    
    try {
        const results = await trackwrestlingScraperService.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50', // Utah
            headless: true,
            maxEvents: 1, // Only 1 event for quick test
            maxTeams: 3   // Only 3 teams per event
        });

        console.log('\n🎉 Fixed scraper test completed!');
        console.log('📊 Results Summary:');
        console.log(`   Total Events Processed: ${results.totalEvents}`);
        console.log(`   Total Teams Processed: ${results.totalTeams}`);
        console.log(`   Total Matches Found: ${results.totalMatches}`);
        console.log(`   Total Matches Processed: ${results.processedMatches}`);
        console.log(`   Errors Encountered: ${results.errors.length}`);

        if (results.processedMatches > 0) {
            console.log('\n✅ SUCCESS! Found and processed actual matches!');
            console.log('🎯 The match detection fix is working correctly.');
        } else {
            console.log('\n⚠️ Still no matches processed. Need further investigation.');
        }

        if (results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.type}: ${error.error}`);
            });
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testFixedScraper().then(() => {
    console.log('✅ Fixed scraper test completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
});

