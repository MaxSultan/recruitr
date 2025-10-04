const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function scrapeUtahBatch2() {
    console.log('🏆 Utah 2024-25 High School Boys - Batch 2 (Events 6-10)');
    console.log('📊 Processing events 6-10 with COMPLETE data capture...');
    console.log('⚠️  NO team limits - capturing ALL teams and matches per event');
    
    try {
        const results = await trackwrestlingScraperService.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50', // Utah
            headless: true,
            maxEvents: 5,  // Events 6-10
            maxTeams: null, // NO LIMIT - capture ALL teams and matches
            batchNumber: 2,
            batchDescription: 'Events 6-10 (Complete Data Capture)'
        });

        console.log('\n🎉 Batch 2 Completed!');
        console.log('📊 Results Summary:');
        console.log(`   Events Processed: ${results.totalEvents}`);
        console.log(`   Teams Processed: ${results.totalTeams}`);
        console.log(`   Matches Found: ${results.totalMatches}`);
        console.log(`   Matches Processed: ${results.processedMatches}`);
        console.log(`   Errors: ${results.errors?.length || 0}`);

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
        }

        if (results.errors && results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.type}: ${error.error}`);
            });
        }

        console.log('\n🔄 To continue with more events, run:');
        console.log('   node scripts/scrape-utah-batch-3.js (Events 11-15)');

    } catch (error) {
        console.error('❌ Batch 2 failed:', error);
    }
}

// Run the scraper
scrapeUtahBatch2().then(() => {
    console.log('✅ Utah Batch 2 script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
