const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');
const ScrapingStateService = require('../services/scrapers/scrapingStateService');

async function scrapeUtahChronologicalStateful() {
    console.log('🏆 Utah 2024-25 High School Boys - CHRONOLOGICAL & STATEFUL');
    console.log('📊 Features:');
    console.log('   ✅ Events processed in chronological order');
    console.log('   ✅ Event dates extracted and stored');
    console.log('   ✅ Match dates set to event date');
    console.log('   ✅ Matches ordered chronologically within events');
    console.log('   ✅ State saved and can resume from interruptions');
    console.log('   ✅ Progress tracking with detailed statistics');
    console.log('');
    
    const startTime = Date.now();
    
    // Initialize state service
    const stateService = new ScrapingStateService('2024-25 High School Boys', '50');
    
    try {
        console.log('🚀 Starting chronological stateful scraping...');
        
        // Check if we need to get events list first
        if (!stateService.state.events || stateService.state.events.length === 0) {
            console.log('📅 Getting chronological events list...');
            
            // Get all events in chronological order
            const events = await trackwrestlingScraperService.getEventsChronologically({
                targetSeason: '2024-25 High School Boys',
                stateId: '50',
                headless: true
            });
            
            if (!events || events.length === 0) {
                throw new Error('No events found');
            }
            
            console.log(`✅ Found ${events.length} events in chronological order`);
            stateService.initializeEvents(events);
        }
        
        // Process events one by one
        let processedCount = 0;
        const maxEventsPerRun = 5; // Process 5 events per run to avoid long sessions
        
        while (!stateService.isComplete() && processedCount < maxEventsPerRun) {
            const event = stateService.getNextEvent();
            if (!event) break;
            
            console.log(`\n📅 Processing event ${stateService.state.currentEventIndex + 1}/${stateService.state.totalEvents}: ${event.text}`);
            console.log(`📆 Event date: ${event.dateText}`);
            
            try {
                // Process this specific event with chronological match ordering
                const result = await trackwrestlingScraperService.scrapeEventChronologically({
                    event: event,
                    maxTeams: 10, // Process up to 10 teams per event
                    headless: true
                });
                
                stateService.markEventProcessed(event, result);
                processedCount++;
                
                console.log(`✅ Event completed: ${result.processedMatches} matches processed`);
                
            } catch (error) {
                console.error(`❌ Event failed: ${error.message}`);
                stateService.markEventFailed(event, error.message);
                processedCount++;
            }
            
            // Show progress
            console.log(stateService.getProgressSummary());
            
            // Small delay between events
            if (!stateService.isComplete()) {
                console.log('⏳ Waiting 5 seconds before next event...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        const stats = stateService.getStats();
        
        console.log('\n🎉 Chronological stateful scraping completed!');
        console.log('📊 Final Results:');
        console.log(`   ⏱️  Duration: ${Math.round(duration / 60)} minutes`);
        console.log(`   📅 Events processed: ${stats.processed}`);
        console.log(`   ⏭️  Events skipped: ${stats.skipped}`);
        console.log(`   ❌ Events failed: ${stats.failed}`);
        console.log(`   🥊 Total matches: ${stats.processedMatches}`);
        console.log(`   📈 Progress: ${stats.progressPercentage}% complete`);
        
        if (stats.remaining > 0) {
            console.log(`\n🔄 Remaining events: ${stats.remaining}`);
            console.log('💡 Run this script again to continue processing');
            console.log('📂 Progress is saved and will resume from where you left off');
        } else {
            console.log('\n✅ All events processed! Utah 2024-25 season scraping complete!');
        }
        
        // Show some sample matches if we processed any
        if (stats.processedMatches > 0) {
            console.log('\n🎯 Sample processed matches:');
            // This would need to be implemented to show actual matches
            console.log('   (Match details would be shown here)');
        }
        
    } catch (error) {
        console.error('❌ Chronological stateful scraping failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Save state even on error
        stateService.saveState();
    }
}

// Run the scraper
scrapeUtahChronologicalStateful().then(() => {
    console.log('✅ Utah chronological stateful script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


