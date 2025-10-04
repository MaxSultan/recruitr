const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');
const ScrapingStateService = require('../services/scrapers/scrapingStateService');

async function scrapeUtahChronologicalProven() {
    console.log('🏆 Utah 2024-25 High School Boys - CHRONOLOGICAL & PROVEN STRATEGY');
    console.log('📊 Features:');
    console.log('   ✅ Events processed in chronological order');
    console.log('   ✅ Event dates extracted and stored');
    console.log('   ✅ Uses proven tiny batch approach (no iframe issues)');
    console.log('   ✅ State saved and can resume from interruptions');
    console.log('   ✅ Progress tracking with detailed statistics');
    console.log('');
    
    const startTime = Date.now();
    
    // Initialize state service
    const stateService = new ScrapingStateService('2024-25 High School Boys', '50');
    
    try {
        console.log('🚀 Starting chronological proven scraping...');
        
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
        
        // Process events using the proven tiny batch approach
        let processedCount = 0;
        const maxEventsPerRun = 3; // Process 3 events per run
        
        while (!stateService.isComplete() && processedCount < maxEventsPerRun) {
            const event = stateService.getNextEvent();
            if (!event) break;
            
            console.log(`\n📅 Processing event ${stateService.state.currentEventIndex + 1}/${stateService.state.totalEvents}: ${event.text}`);
            console.log(`📆 Event date: ${event.dateText}`);
            
            try {
                // Use the proven working approach: process 1 event with limited teams
                const result = await trackwrestlingScraperService.scrapeMatches({
                    targetSeason: '2024-25 High School Boys',
                    stateId: '50',
                    headless: true,
                    maxEvents: 1,  // Only 1 event at a time (proven to work)
                    maxTeams: 5,   // Limited teams (proven to work)
                    specificEventIndex: stateService.state.currentEventIndex, // Process specific event
                    eventDate: event.date, // Pass the event date
                    batchNumber: stateService.state.currentEventIndex + 1,
                    batchDescription: `Chronological Event ${stateService.state.currentEventIndex + 1}: ${event.text}`
                });
                
                // Update result with event date info
                result.eventName = event.text;
                result.eventDate = event.dateText;
                result.eventDateParsed = event.date;
                
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
                console.log('⏳ Waiting 10 seconds before next event...');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        const stats = stateService.getStats();
        
        console.log('\n🎉 Chronological proven scraping completed!');
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
            console.log('\n🎯 NEXT RUNS:');
            console.log('   1. Run this script again to process next 3 events');
            console.log('   2. Each run processes 3 events chronologically');
            console.log('   3. State is preserved between runs');
            console.log('   4. Eventually will process all 50 Utah events');
        } else {
            console.log('\n✅ All events processed! Utah 2024-25 season scraping complete!');
        }
        
        // Show sample of processed events
        if (stats.processed > 0) {
            console.log('\n🎯 Sample processed events:');
            stateService.state.processedEvents.slice(-3).forEach((event, index) => {
                console.log(`   ${index + 1}. ${event.dateText} - ${event.text} (${event.result?.processedMatches || 0} matches)`);
            });
        }
        
    } catch (error) {
        console.error('❌ Chronological proven scraping failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Save state even on error
        stateService.saveState();
    }
}

// Run the scraper
scrapeUtahChronologicalProven().then(() => {
    console.log('✅ Utah chronological proven script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


