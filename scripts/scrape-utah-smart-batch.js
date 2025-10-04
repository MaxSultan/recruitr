const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

class SmartUtahBatcher {
    constructor() {
        this.totalEvents = 50; // We know there are ~50 events from the test
        this.eventsPerBatch = 5; // Process 5 events per batch for optimal performance
        this.delayBetweenBatches = 30000; // 30 seconds between batches
    }

    async runAllBatches() {
        console.log('🏆 Utah 2024-25 High School Boys - Smart Batching Strategy');
        console.log(`📊 Total Events: ~${this.totalEvents}`);
        console.log(`📦 Events per batch: ${this.eventsPerBatch}`);
        console.log(`⏱️  Delay between batches: ${this.delayBetweenBatches / 1000} seconds`);
        console.log(`🎯 Estimated batches: ${Math.ceil(this.totalEvents / this.eventsPerBatch)}`);
        console.log('');

        const totalBatches = Math.ceil(this.totalEvents / this.eventsPerBatch);
        let totalProcessedMatches = 0;
        let totalProcessedEvents = 0;

        for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
            const startEvent = (batchNum - 1) * this.eventsPerBatch + 1;
            const endEvent = Math.min(batchNum * this.eventsPerBatch, this.totalEvents);
            
            console.log(`\n🚀 Starting Batch ${batchNum}/${totalBatches} (Events ${startEvent}-${endEvent})`);
            console.log('⚠️  NO team limits - capturing ALL teams and matches per event');
            
            const batchStartTime = Date.now();
            
            try {
                const results = await trackwrestlingScraperService.scrapeMatches({
                    targetSeason: '2024-25 High School Boys',
                    stateId: '50', // Utah
                    headless: true,
                    maxEvents: this.eventsPerBatch, // Only process this batch's events
                    maxTeams: null, // NO LIMIT - capture ALL teams and matches
                    batchNumber: batchNum,
                    batchDescription: `Events ${startEvent}-${endEvent} (Smart Batch)`
                });

                const batchDuration = Math.round((Date.now() - batchStartTime) / 1000);
                
                console.log(`\n✅ Batch ${batchNum} completed in ${batchDuration} seconds!`);
                console.log('📊 Batch Results:');
                console.log(`   Events Processed: ${results.totalEvents}`);
                console.log(`   Teams Processed: ${results.totalTeams}`);
                console.log(`   Matches Found: ${results.totalMatches}`);
                console.log(`   Matches Processed: ${results.processedMatches}`);
                console.log(`   Errors: ${results.errors?.length || 0}`);
                
                totalProcessedMatches += results.processedMatches;
                totalProcessedEvents += results.totalEvents;
                
                if (results.processedMatches > 0) {
                    console.log('🎯 NEW MATCHES FOUND AND PROCESSED!');
                } else {
                    console.log('ℹ️ No new matches (likely duplicates from previous runs)');
                }

                if (results.errors && results.errors.length > 0) {
                    console.log('\n❌ Batch Errors:');
                    results.errors.forEach((error, index) => {
                        console.log(`   ${index + 1}. ${error.type}: ${error.error}`);
                    });
                }

                // Performance metrics
                if (results.totalTeams > 0) {
                    const teamsPerSecond = (results.totalTeams / batchDuration).toFixed(2);
                    console.log(`📈 Performance: ${teamsPerSecond} teams/second`);
                }

                // Delay before next batch (except for last batch)
                if (batchNum < totalBatches) {
                    console.log(`\n⏳ Waiting ${this.delayBetweenBatches / 1000} seconds before next batch...`);
                    await this.sleep(this.delayBetweenBatches);
                }

            } catch (error) {
                console.error(`❌ Batch ${batchNum} failed:`, error.message);
                console.log('🔄 Continuing with next batch...');
                
                // Short delay before retry
                await this.sleep(5000);
            }
        }
        
        // Final summary
        console.log('\n🎉 ALL BATCHES COMPLETED!');
        console.log('📊 FINAL SUMMARY:');
        console.log(`   Total Events Processed: ${totalProcessedEvents}`);
        console.log(`   Total Matches Processed: ${totalProcessedMatches}`);
        console.log(`   Batches Completed: ${totalBatches}`);
        
        if (totalProcessedMatches > 0) {
            console.log('\n✅ SUCCESS! Found and processed Utah wrestling matches!');
            console.log('🌐 Open http://localhost:3000 to view the data');
            console.log('📊 Use the audit trail feature to explore athlete rating evolution');
        } else {
            console.log('\n⚠️ No new matches were processed.');
            console.log('   This could mean:');
            console.log('   - All matches were already in the database');
            console.log('   - Events haven\'t concluded yet');
            console.log('   - Individual results aren\'t posted yet');
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function runSmartBatching() {
    const batcher = new SmartUtahBatcher();
    await batcher.runAllBatches();
}

// Run the smart batcher
if (require.main === module) {
    runSmartBatching().then(() => {
        console.log('✅ Smart batching completed');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Smart batching failed:', error);
        process.exit(1);
    });
}

module.exports = { SmartUtahBatcher, runSmartBatching };


