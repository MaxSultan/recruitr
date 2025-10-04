const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');
const ScrapingStateService = require('../services/scrapers/scrapingStateService');

async function processAll250UtahEvents() {
    console.log('🏆 Processing ALL 250 Utah 2024-25 High School Boys Events');
    console.log('📊 Complete season processing with chronological order and state management');
    console.log('🎯 This will process the entire Utah wrestling season');
    console.log('');
    
    const startTime = Date.now();
    
    // Initialize state service
    const stateService = new ScrapingStateService('2024-25 High School Boys', '50');
    
    try {
        console.log('🚀 Starting complete Utah season processing...');
        
        // Check if we need to get events list first
        if (!stateService.state.events || stateService.state.events.length === 0) {
            console.log('📅 Getting all 250 events list...');
            
            // Get all 250 events with improved pagination
            const events = await trackwrestlingScraperService.getEventsChronologically({
                targetSeason: '2024-25 High School Boys',
                stateId: '50',
                headless: true
            });
            
            if (!events || events.length === 0) {
                throw new Error('No events found');
            }
            
            console.log(`✅ Found ${events.length} events in chronological order`);
            if (events.length === 250) {
                console.log('🎯 Perfect! All 250 events found!');
            } else {
                console.log(`⚠️ Expected 250 events, found ${events.length}`);
            }
            
            stateService.initializeEvents(events);
        }
        
        // Process all events in batches
        let processedCount = 0;
        const totalEvents = stateService.state.totalEvents;
        const batchSize = 10; // Process 10 events per run to avoid long sessions
        
        console.log(`🎯 Processing all ${totalEvents} events in batches of ${batchSize}...`);
        console.log(`📊 Estimated total runs needed: ${Math.ceil(totalEvents / batchSize)}`);
        
        while (!stateService.isComplete()) {
            const eventsInBatch = Math.min(batchSize, totalEvents - processedCount);
            console.log(`\n🚀 Processing batch: ${processedCount + 1}-${processedCount + eventsInBatch} of ${totalEvents}`);
            
            for (let i = 0; i < eventsInBatch && !stateService.isComplete(); i++) {
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
                        batchDescription: `Complete Season Event ${stateService.state.currentEventIndex + 1}: ${event.text}`
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
                    console.log('⏳ Waiting 3 seconds before next event...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            
            // Show batch completion status
            const batchDuration = Math.round((Date.now() - startTime) / 1000);
            const eventsPerMinute = processedCount > 0 ? Math.round((processedCount / batchDuration) * 60) : 0;
            const estimatedRemaining = processedCount > 0 ? Math.round((totalEvents - processedCount) / (processedCount / batchDuration)) : 0;
            
            console.log(`\n📊 Batch completed!`);
            console.log(`   ⏱️  Runtime: ${Math.round(batchDuration / 60)} minutes`);
            console.log(`   📈 Events/minute: ${eventsPerMinute}`);
            console.log(`   🎯 Estimated remaining time: ${Math.round(estimatedRemaining / 60)} minutes`);
            
            // If not complete, save state and provide instructions for next run
            if (!stateService.isComplete()) {
                console.log(`\n💾 Progress saved. To continue processing:`);
                console.log(`   node scripts/process-all-250-utah-events.js`);
                console.log(`   (Will resume from event ${stateService.state.currentEventIndex + 1})`);
                break; // Exit the while loop to allow for resumption
            }
        }
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        const stats = stateService.getStats();
        
        console.log('\n🎉 Utah 2024-25 season processing completed!');
        console.log('📊 Final Results:');
        console.log(`   ⏱️  Total Duration: ${Math.round(duration / 60)} minutes`);
        console.log(`   📅 Events processed: ${stats.processed}`);
        console.log(`   ⏭️  Events skipped: ${stats.skipped}`);
        console.log(`   ❌ Events failed: ${stats.failed}`);
        console.log(`   🥊 Total matches: ${stats.processedMatches}`);
        console.log(`   📈 Progress: ${stats.progressPercentage}% complete`);
        
        if (stats.processed === 250) {
            console.log('\n🎯 MISSION ACCOMPLISHED!');
            console.log('✅ Successfully processed ALL 250 Utah wrestling events!');
            console.log('🏆 Complete 2024-25 Utah High School Boys season data collected!');
        } else if (stats.processed > 200) {
            console.log('\n🎯 NEARLY COMPLETE!');
            console.log(`✅ Processed ${stats.processed}/250 events (${stats.progressPercentage}%)`);
            console.log('🔄 Run the script again to continue processing remaining events');
        } else {
            console.log('\n🔄 PARTIAL COMPLETION');
            console.log(`📊 Processed ${stats.processed}/250 events (${stats.progressPercentage}%)`);
            console.log('💡 Run the script again to continue processing');
        }
        
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
processAll250UtahEvents().then(() => {
    console.log('✅ Utah 2024-25 season processing completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


