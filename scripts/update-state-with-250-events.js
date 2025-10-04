const ScrapingStateService = require('../services/scrapers/scrapingStateService');
const fs = require('fs');
const path = require('path');

async function updateStateWith250Events() {
    console.log('\n🔄 Updating scraping state with all 250 Utah events...');
    
    const targetSeason = '2024-25 High School Boys';
    const stateId = '50';
    const stateService = new ScrapingStateService(targetSeason, stateId);
    
    try {
        // Load the 250 events from the file
        const eventsPath = path.join(__dirname, '../data/all-utah-events.json');
        const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
        const allEvents = eventsData.events;
        
        console.log(`📊 Loaded ${allEvents.length} events from file`);
        
        // Update the state with all 250 events
        stateService.initializeEvents(allEvents);
        
        console.log(`✅ Updated state with ${allEvents.length} events`);
        console.log(`📅 Events range from ${allEvents[0].dateText} to ${allEvents[allEvents.length - 1].dateText}`);
        
        // Save the updated state
        stateService.saveState();
        
        console.log('\n🎯 State updated successfully!');
        console.log('📊 Current state:');
        console.log(`   📅 Total events: ${stateService.state.totalEvents}`);
        console.log(`   📍 Current event index: ${stateService.state.currentEventIndex}`);
        console.log(`   ⏭️  Processed events: ${stateService.state.processedEvents.length}`);
        console.log(`   ❌ Failed events: ${stateService.state.failedEvents.length}`);
        console.log(`   🥊 Total matches: ${stateService.state.processedMatches}`);
        
        console.log('\n💡 Ready to run: node scripts/process-all-250-utah-events.js');
        
    } catch (error) {
        console.error('❌ Error updating state:', error);
        console.error('Stack trace:', error.stack);
    }
}

updateStateWith250Events();
