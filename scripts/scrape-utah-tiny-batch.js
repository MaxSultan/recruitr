const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function scrapeUtahTinyBatch() {
    console.log('🏆 Utah 2024-25 High School Boys - TINY Batch Strategy');
    console.log('📊 Ultra-conservative approach: 1 event, 2 teams maximum');
    console.log('⏱️ This should complete quickly and not hang');
    
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting tiny batch scraping...');
        
        const results = await trackwrestlingScraperService.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50', // Utah
            headless: true,
            maxEvents: 1,  // Only 1 event at a time
            maxTeams: 2,   // Only 2 teams per event to avoid hanging
            batchNumber: 1,
            batchDescription: 'Tiny Batch (1 event, 2 teams) - Ultra Conservative'
        });

        const duration = Math.round((Date.now() - startTime) / 1000);
        
        console.log(`\n🎉 Tiny batch completed in ${duration} seconds!`);
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
            
            console.log('\n🔄 Strategy for scaling up:');
            console.log('   1. Run this script multiple times in sequence');
            console.log('   2. Each run processes 1 event with 2 teams');
            console.log('   3. Duplicate detection prevents re-processing');
            console.log('   4. Gradually increase limits if stable');
            
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

        // Provide next steps
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. If this worked (completed quickly): Run it again');
        console.log('2. If it worked well: Try increasing to 3-5 teams');
        console.log('3. If it still hangs: The issue is deeper in the browser automation');
        console.log('4. Consider running multiple instances in parallel');

    } catch (error) {
        console.error('❌ Tiny batch failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the scraper
scrapeUtahTinyBatch().then(() => {
    console.log('✅ Utah tiny batch script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


