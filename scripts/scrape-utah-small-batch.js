const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function scrapeUtahSmallBatch() {
    console.log('🏆 Utah 2024-25 High School Boys - SMALL Batch Strategy');
    console.log('📊 Gradual scale-up: 1 event, 5 teams maximum');
    console.log('⏱️ Building on the success of tiny batch (2 teams)');
    
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting small batch scraping...');
        
        const results = await trackwrestlingScraperService.scrapeMatches({
            targetSeason: '2024-25 High School Boys',
            stateId: '50', // Utah
            headless: true,
            maxEvents: 1,  // Still 1 event at a time
            maxTeams: 5,   // Increased from 2 to 5 teams
            batchNumber: 1,
            batchDescription: 'Small Batch (1 event, 5 teams) - Gradual Scale-up'
        });

        const duration = Math.round((Date.now() - startTime) / 1000);
        
        console.log(`\n🎉 Small batch completed in ${duration} seconds!`);
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
            
            console.log('\n🔄 Scaling strategy:');
            console.log('   1. ✅ Tiny batch (2 teams): 51 seconds - WORKING');
            console.log('   2. 🔄 Small batch (5 teams): Testing now...');
            console.log('   3. 🎯 Next: Medium batch (10 teams) if this works');
            console.log('   4. 🚀 Final: Large batch (20 teams) if stable');
            
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

        // Performance comparison
        const expectedDuration = duration; // Current duration
        const teamsProcessed = results.totalTeams;
        
        if (teamsProcessed > 0) {
            console.log('\n📊 Performance Analysis:');
            console.log(`   Teams processed: ${teamsProcessed}`);
            console.log(`   Duration: ${duration} seconds`);
            console.log(`   Teams per second: ${(teamsProcessed / duration).toFixed(2)}`);
            
            // Estimate for larger batches
            const estimatedFor10Teams = Math.round((duration / teamsProcessed) * 10);
            const estimatedFor20Teams = Math.round((duration / teamsProcessed) * 20);
            
            console.log(`   Estimated for 10 teams: ~${estimatedFor10Teams} seconds`);
            console.log(`   Estimated for 20 teams: ~${estimatedFor20Teams} seconds`);
        }

        console.log('\n🎯 NEXT STEPS:');
        if (duration < 120) { // Less than 2 minutes
            console.log('✅ Small batch completed quickly - ready to scale up!');
            console.log('🔄 Try: node scripts/scrape-utah-medium-batch.js (10 teams)');
        } else {
            console.log('⚠️ Small batch took longer than expected');
            console.log('🔄 Stick with: node scripts/scrape-utah-tiny-batch.js (2 teams)');
        }

    } catch (error) {
        console.error('❌ Small batch failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the scraper
scrapeUtahSmallBatch().then(() => {
    console.log('✅ Utah small batch script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


