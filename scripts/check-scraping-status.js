const fs = require('fs');
const path = require('path');

function checkScrapingStatus() {
    console.log('📊 Checking Utah 2024-25 High School Boys Scraping Progress...\n');
    
    try {
        const stateFile = path.join(__dirname, '../data/scraping-state-2024-25-High-School-Boys-50.json');
        const stateData = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        
        console.log('🎯 SCRAPING STATUS:');
        console.log(`   📅 Season: ${stateData.seasonName}`);
        console.log(`   🏛️  State ID: ${stateData.stateId}`);
        console.log(`   🕐 Started: ${new Date(stateData.startTime).toLocaleString()}`);
        console.log(`   🕐 Last Update: ${new Date(stateData.lastUpdate).toLocaleString()}`);
        console.log(`   📊 Total Events: ${stateData.totalEvents}`);
        console.log(`   📍 Current Event Index: ${stateData.currentEventIndex || 0}`);
        
        const processedCount = stateData.processedEvents ? stateData.processedEvents.length : 0;
        const failedCount = stateData.failedEvents ? stateData.failedEvents.length : 0;
        const skippedCount = stateData.skippedEvents ? stateData.skippedEvents.length : 0;
        
        console.log(`   ✅ Processed Events: ${processedCount}`);
        console.log(`   ❌ Failed Events: ${failedCount}`);
        console.log(`   ⏭️  Skipped Events: ${skippedCount}`);
        console.log(`   🥊 Total Matches: ${stateData.processedMatches || 0}`);
        
        const progress = ((processedCount + failedCount) / stateData.totalEvents) * 100;
        console.log(`   📈 Progress: ${progress.toFixed(1)}%`);
        
        const remaining = stateData.totalEvents - processedCount - failedCount;
        console.log(`   ⏳ Remaining: ${remaining} events`);
        
        console.log('\n📋 RECENT EVENTS PROCESSED:');
        if (stateData.processedEvents && stateData.processedEvents.length > 0) {
            const recentEvents = stateData.processedEvents.slice(-5);
            recentEvents.forEach((event, index) => {
                const result = event.result;
                console.log(`   ${recentEvents.length - index}. ${event.text}`);
                console.log(`      📅 Date: ${event.dateText}`);
                console.log(`      🏫 Teams: ${result.totalTeams}`);
                console.log(`      🥊 Matches: ${result.totalMatches} (${result.processedMatches} processed)`);
                console.log(`      ⚠️  Errors: ${result.errors ? result.errors.length : 0}`);
                console.log('');
            });
        }
        
        console.log('❌ FAILED EVENTS:');
        if (stateData.failedEvents && stateData.failedEvents.length > 0) {
            const recentFailures = stateData.failedEvents.slice(-3);
            recentFailures.forEach((failure, index) => {
                console.log(`   ${recentFailures.length - index}. ${failure.text}`);
                console.log(`      📅 Date: ${failure.dateText}`);
                console.log(`      ❌ Error: ${failure.error}`);
                console.log('');
            });
        } else {
            console.log('   ✅ No failed events!');
        }
        
        console.log('🎯 NEXT STEPS:');
        if (remaining > 0) {
            console.log(`   🔄 Run: node scripts/process-all-250-utah-events.js`);
            console.log(`   📊 Will process next batch of events starting from index ${stateData.currentEventIndex || 0}`);
        } else {
            console.log('   🎉 All events have been processed!');
        }
        
        // Calculate estimated completion time
        if (processedCount > 0) {
            const startTime = new Date(stateData.startTime);
            const lastUpdate = new Date(stateData.lastUpdate);
            const elapsedMinutes = (lastUpdate - startTime) / (1000 * 60);
            const eventsPerMinute = processedCount / elapsedMinutes;
            const estimatedMinutesRemaining = remaining / eventsPerMinute;
            
            console.log('\n⏱️  TIME ESTIMATES:');
            console.log(`   📊 Events/minute: ${eventsPerMinute.toFixed(2)}`);
            console.log(`   ⏳ Estimated time remaining: ${Math.round(estimatedMinutesRemaining)} minutes`);
        }
        
    } catch (error) {
        console.error('❌ Error reading scraping state:', error.message);
    }
}

checkScrapingStatus();


