const ScrapingStateService = require('../services/scrapers/scrapingStateService');

async function resetScrapingProgress() {
    console.log('\n🔄 Resetting scraping progress to start from beginning...');
    
    const targetSeason = '2024-25 High School Boys';
    const stateId = '50';
    const stateService = new ScrapingStateService(targetSeason, stateId);
    
    try {
        // Reset the current event index to start from the beginning
        stateService.state.currentEventIndex = 0;
        stateService.state.processedEvents = [];
        stateService.state.skippedEvents = [];
        stateService.state.failedEvents = [];
        stateService.state.processedMatches = 0;
        stateService.state.totalMatches = 0;
        stateService.state.errors = [];
        stateService.state.startTime = new Date().toISOString();
        stateService.state.lastUpdate = new Date().toISOString();
        
        // Save the reset state
        stateService.saveState();
        
        console.log('\n🎯 Progress reset successfully!');
        console.log('📊 Current state:');
        console.log(`   📅 Total events: ${stateService.state.totalEvents}`);
        console.log(`   📍 Current event index: ${stateService.state.currentEventIndex}`);
        console.log(`   ⏭️  Processed events: ${stateService.state.processedEvents.length}`);
        console.log(`   ❌ Failed events: ${stateService.state.failedEvents.length}`);
        console.log(`   🥊 Total matches: ${stateService.state.processedMatches}`);
        
        console.log('\n💡 Ready to run: node scripts/process-all-250-utah-events.js');
        
    } catch (error) {
        console.error('❌ Error resetting progress:', error);
        console.error('Stack trace:', error.stack);
    }
}

resetScrapingProgress();


