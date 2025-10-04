const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function scrapeUtahSimple() {
    console.log('🏆 Utah 2024-25 High School Boys - Simple Scraping');
    console.log('📊 Processing with minimal settings to avoid hangs');
    console.log('🎯 Strategy: Small limits, quick processing');
    
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting simple scraping...');
        
        const results = await trackwrestlingScraperService.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50', // Utah
            headless: true,
            maxEvents: 2,  // Only 2 events to start
            maxTeams: 10,  // Only 10 teams per event to avoid hangs
            batchNumber: 1,
            batchDescription: 'Simple Test (2 events, 10 teams each)'
        });

        const duration = Math.round((Date.now() - startTime) / 1000);
        
        console.log(`\n🎉 Simple scraping completed in ${duration} seconds!`);
        console.log('📊 Results Summary:');
        console.log(`   Events Processed: ${results.totalEvents}`);
        console.log(`   Teams Processed: ${results.totalTeams}`);
        console.log(`   Matches Found: ${results.totalMatches}`);
        console.log(`   Matches Processed: ${results.processedMatches}`);
        console.log(`   Errors: ${results.errors?.length || 0}`);
        console.log(`   Duration: ${duration} seconds`);

        if (results.processedMatches > 0) {
            console.log('\n✅ SUCCESS! Found and processed Utah wrestling matches!');
            console.log('🎯 The scraper is working with real Utah data.');
            console.log('🌐 Open http://localhost:3000 to view the data');
            
            // Performance analysis
            if (results.totalTeams > 0) {
                const teamsPerSecond = (results.totalTeams / duration).toFixed(2);
                console.log(`📈 Performance: ${teamsPerSecond} teams/second`);
            }
            
            // If this worked well, suggest next steps
            console.log('\n🔄 Next steps:');
            console.log('   1. If this worked well, increase limits gradually');
            console.log('   2. Run: node scripts/scrape-utah-simple.js (with higher limits)');
            console.log('   3. Or create a loop to process more events');
            
        } else {
            console.log('\n⚠️ No matches processed in this batch.');
            console.log('   This could be normal if:');
            console.log('   - Events haven\'t concluded yet');
            console.log('   - Individual results aren\'t posted yet');
            console.log('   - Data is still being entered');
            console.log('   - Matches were already processed (duplicates)');
        }

        if (results.errors && results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.type}: ${error.error}`);
            });
        }

    } catch (error) {
        console.error('❌ Simple scraping failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the scraper
scrapeUtahSimple().then(() => {
    console.log('✅ Utah simple scraping completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});