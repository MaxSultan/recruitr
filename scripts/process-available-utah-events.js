const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');
const ScrapingStateService = require('../services/scrapers/scrapingStateService');

async function processAvailableUtahEvents() {
    console.log('🏆 Processing Available Utah 2024-25 High School Boys Events');
    console.log('📊 Starting with the 50 events we can currently access');
    console.log('🎯 Goal: Process all available events, then investigate getting the remaining ~200');
    console.log('');
    
    const startTime = Date.now();
    
    // Initialize state service
    const stateService = new ScrapingStateService('2024-25 High School Boys', '50');
    
    try {
        console.log('🚀 Starting processing of available events...');
        
        // Check if we need to get events list first
        if (!stateService.state.events || stateService.state.events.length === 0) {
            console.log('📅 Getting available events list...');
            
            // Get all events we can currently access
            const events = await trackwrestlingScraperService.getEventsChronologically({
                targetSeason: '2024-25 High School Boys',
                stateId: '50',
                headless: true
            });
            
            if (!events || events.length === 0) {
                throw new Error('No events found');
            }
            
            console.log(`✅ Found ${events.length} events we can currently access`);
            stateService.initializeEvents(events);
        }
        
        // Process all available events
        let processedCount = 0;
        const totalEvents = stateService.state.totalEvents;
        
        console.log(`🎯 Processing all ${totalEvents} available events...`);
        
        while (!stateService.isComplete()) {
            const event = stateService.getNextEvent();
            if (!event) break;
            
            console.log(`\n📅 Processing event ${stateService.state.currentEventIndex + 1}/${totalEvents}: ${event.text}`);
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
                    batchDescription: `Available Event ${stateService.state.currentEventIndex + 1}: ${event.text}`
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
                console.log('⏳ Waiting 5 seconds before next event...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        const stats = stateService.getStats();
        
        console.log('\n🎉 Processing of available events completed!');
        console.log('📊 Final Results:');
        console.log(`   ⏱️  Duration: ${Math.round(duration / 60)} minutes`);
        console.log(`   📅 Events processed: ${stats.processed}`);
        console.log(`   ⏭️  Events skipped: ${stats.skipped}`);
        console.log(`   ❌ Events failed: ${stats.failed}`);
        console.log(`   🥊 Total matches: ${stats.processedMatches}`);
        console.log(`   📈 Progress: 100% of available events complete`);
        
        console.log('\n🎯 Next Steps:');
        console.log('✅ Successfully processed all available events');
        console.log('🔍 Now we need to investigate how to access the remaining ~200 events');
        console.log('💡 Possible approaches:');
        console.log('   1. Check for different filters or views');
        console.log('   2. Look for "Show All" or "View All" options');
        console.log('   3. Check if events are in different categories');
        console.log('   4. Investigate if there are different URLs or parameters');
        console.log('   5. Check if events are loaded dynamically with JavaScript');
        
        // Show some sample processed events
        if (stats.processed > 0) {
            console.log('\n🎯 Sample processed events:');
            stateService.state.processedEvents.slice(-5).forEach((event, index) => {
                console.log(`   ${index + 1}. ${event.dateText} - ${event.text} (${event.result?.processedMatches || 0} matches)`);
            });
        }
        
        // Save final state
        stateService.saveState();
        
    } catch (error) {
        console.error('❌ Processing failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Save state even on error
        stateService.saveState();
    }
}

// Run the processor
processAvailableUtahEvents().then(() => {
    console.log('✅ Available events processing completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


