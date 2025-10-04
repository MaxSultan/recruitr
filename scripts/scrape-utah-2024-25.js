const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function scrapeUtah202425() {
    console.log('🏆 Starting Utah 2024-25 High School Boys Wrestling Scrape...');
    
    try {
        // Utah 2024-25 High School Boys wrestling season parameters
        const utahSeason = {
            name: '2024-25 High School Boys',
            state: 'Utah',
            year: 2024,
            division: 'High School',
            gender: 'Boys'
        };

        console.log(`📊 Scraping: ${utahSeason.name} - ${utahSeason.state}`);
        
        // Configure scraper for Utah high school boys wrestling
        const scraperConfig = {
            maxEvents: 100, // Limit to prevent overwhelming
            maxTeamsPerEvent: 50,
            maxMatchesPerTeam: 200,
            delayBetweenRequests: 1000, // 1 second delay
            includeTournaments: true,
            includeDuals: true,
            includeChampionships: true
        };

        console.log('🔧 Scraper Configuration:', scraperConfig);
        
        // Start the scraping process
        const results = await trackwrestlingScraperService.scrapeMatches({
            targetSeason: utahSeason.name,
            stateId: '50', // Utah state ID
            headless: true,
            maxEvents: scraperConfig.maxEvents,
            maxTeams: scraperConfig.maxTeamsPerEvent
        });

        console.log('\n🎉 Utah 2024-25 Scraping Completed!');
        console.log('📊 Results Summary:');
        console.log(`   Total Events Processed: ${results.totalEvents}`);
        console.log(`   Total Teams Processed: ${results.totalTeams}`);
        console.log(`   Total Matches Found: ${results.totalMatches}`);
        console.log(`   Total Matches Processed: ${results.processedMatches}`);
        console.log(`   Errors Encountered: ${results.errors.length}`);

        if (results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.type}: ${error.message}`);
            });
        }

        if (results.processedMatches > 0) {
            console.log('\n✅ Successfully processed Utah 2024-25 wrestling data!');
            console.log('🏆 You can now view athlete rankings and audit trails in the web interface.');
            console.log('🌐 Open http://localhost:3000 to explore the data');
        } else {
            console.log('\n⚠️ No matches were processed. This could be due to:');
            console.log('   - Network connectivity issues');
            console.log('   - TrackWrestling site changes');
            console.log('   - No available data for the specified season');
        }

    } catch (error) {
        console.error('❌ Utah 2024-25 scraping failed:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the scraper
scrapeUtah202425().then(() => {
    console.log('✅ Utah 2024-25 scraping script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
