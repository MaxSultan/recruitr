const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function scrapeUtahOptimalBatch1() {
    console.log('🏆 Utah 2024-25 High School Boys - Optimal Batch 1');
    console.log('📊 Processing with OPTIMAL settings for speed + completeness');
    console.log('🎯 Strategy: 1 event, ALL teams, reasonable timeout');
    
    const startTime = Date.now();
    
    try {
        const results = await trackwrestlingScraperService.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50', // Utah
            headless: true,
            maxEvents: 1,  // Only 1 event at a time for optimal performance
            maxTeams: null, // NO LIMIT - capture ALL teams and matches
            batchNumber: 1,
            batchDescription: 'Event 1 (Optimal - Complete Data Capture)',
            // Add timeout to prevent hanging
            timeout: 300000 // 5 minutes max per batch
        });

        const duration = Math.round((Date.now() - startTime) / 1000);
        
        console.log(`\n🎉 Optimal Batch 1 Completed in ${duration} seconds!`);
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

        // Performance analysis
        if (results.totalTeams > 0) {
            const teamsPerSecond = (results.totalTeams / duration).toFixed(2);
            console.log(`\n📈 Performance: ${teamsPerSecond} teams/second`);
        }

        console.log('\n🔄 To continue with more events, run:');
        console.log('   node scripts/scrape-utah-optimal-batch-2.js (Event 2)');

    } catch (error) {
        console.error('❌ Optimal Batch 1 failed:', error);
    }
}

// Run the scraper
scrapeUtahOptimalBatch1().then(() => {
    console.log('✅ Utah Optimal Batch 1 script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


