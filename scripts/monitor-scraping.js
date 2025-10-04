const fs = require('fs');
const path = require('path');

function monitorScraping() {
    console.log('🔍 Monitoring Utah 2024-25 Scraping Progress...\n');
    console.log('Press Ctrl+C to stop monitoring\n');
    
    let lastProcessedCount = 0;
    let lastMatchCount = 0;
    
    function checkProgress() {
        try {
            const stateFile = path.join(__dirname, '../data/scraping-state-2024-25-High-School-Boys-50.json');
            
            if (!fs.existsSync(stateFile)) {
                console.log('❌ Scraping state file not found');
                return;
            }
            
            const stateData = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            
            const processedCount = stateData.processedEvents ? stateData.processedEvents.length : 0;
            const failedCount = stateData.failedEvents ? stateData.failedEvents.length : 0;
            const totalMatches = stateData.processedMatches || 0;
            
            const progress = ((processedCount + failedCount) / stateData.totalEvents) * 100;
            const remaining = stateData.totalEvents - processedCount - failedCount;
            
            // Only show updates if there's been a change
            if (processedCount !== lastProcessedCount || totalMatches !== lastMatchCount) {
                const now = new Date().toLocaleTimeString();
                console.log(`[${now}] 📊 Progress: ${processedCount}/${stateData.totalEvents} events (${progress.toFixed(1)}%) | 🥊 ${totalMatches} matches | ⏳ ${remaining} remaining`);
                
                // Show recent activity
                if (stateData.processedEvents && stateData.processedEvents.length > 0) {
                    const lastEvent = stateData.processedEvents[stateData.processedEvents.length - 1];
                    console.log(`   ✅ Latest: ${lastEvent.text} (${lastEvent.result?.totalMatches || 0} matches)`);
                }
                
                lastProcessedCount = processedCount;
                lastMatchCount = totalMatches;
            }
            
            // Check if completed
            if (remaining <= 0) {
                console.log('\n🎉 SCRAPING COMPLETED!');
                console.log(`📊 Final Results:`);
                console.log(`   ✅ Events Processed: ${processedCount}`);
                console.log(`   ❌ Events Failed: ${failedCount}`);
                console.log(`   🥊 Total Matches: ${totalMatches}`);
                console.log(`   📈 Success Rate: ${((processedCount / stateData.totalEvents) * 100).toFixed(1)}%`);
                
                // Calculate total time
                const startTime = new Date(stateData.startTime);
                const endTime = new Date(stateData.lastUpdate);
                const totalMinutes = (endTime - startTime) / (1000 * 60);
                console.log(`   ⏱️  Total Time: ${Math.round(totalMinutes)} minutes`);
                
                process.exit(0);
            }
            
        } catch (error) {
            console.error('❌ Error monitoring progress:', error.message);
        }
    }
    
    // Check progress every 30 seconds
    const interval = setInterval(checkProgress, 30000);
    
    // Initial check
    checkProgress();
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n🛑 Monitoring stopped');
        clearInterval(interval);
        process.exit(0);
    });
}

monitorScraping();


