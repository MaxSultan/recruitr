const trackwrestlingScraperService = require('../services/scrapers/trackwrestlingScraperService');

async function getAllUtahEvents() {
    console.log('🏆 Getting ALL Utah 2024-25 High School Boys Events');
    console.log('📊 This should find all ~250 events across multiple pages');
    console.log('');
    
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting comprehensive event discovery...');
        
        // Get all events with improved pagination
        const events = await trackwrestlingScraperService.getEventsChronologically({
            targetSeason: '2024-25 High School Boys',
            stateId: '50',
            headless: true
        });
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        console.log(`\n🎉 Event discovery completed in ${duration} seconds!`);
        console.log('📊 Results:');
        console.log(`   📅 Total events found: ${events.length}`);
        
        if (events.length > 0) {
            console.log(`   📅 First event: ${events[0].dateText} - ${events[0].text}`);
            console.log(`   📅 Last event: ${events[events.length - 1].dateText} - ${events[events.length - 1].text}`);
            
            // Group events by date
            const eventsByDate = {};
            events.forEach(event => {
                const date = event.dateText;
                if (!eventsByDate[date]) {
                    eventsByDate[date] = [];
                }
                eventsByDate[date].push(event);
            });
            
            console.log(`\n📊 Events by date (first 10 dates):`);
            const sortedDates = Object.keys(eventsByDate).sort();
            sortedDates.slice(0, 10).forEach(date => {
                console.log(`   ${date}: ${eventsByDate[date].length} events`);
            });
            
            if (sortedDates.length > 10) {
                console.log(`   ... and ${sortedDates.length - 10} more dates`);
            }
            
            // Check if we found the expected ~250 events
            if (events.length >= 200) {
                console.log('\n✅ SUCCESS! Found a comprehensive list of Utah wrestling events!');
                console.log('🎯 This appears to be the complete season data.');
            } else if (events.length >= 100) {
                console.log('\n⚠️ Found many events but may not be complete.');
                console.log('🎯 Consider checking if pagination is working correctly.');
            } else {
                console.log('\n❌ Found fewer events than expected.');
                console.log('🎯 May need to investigate pagination issues.');
            }
        } else {
            console.log('\n❌ No events found. There may be an issue with the scraper.');
        }
        
        // Save events to file for analysis
        const fs = require('fs');
        const path = require('path');
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const eventsFile = path.join(dataDir, 'all-utah-events.json');
        fs.writeFileSync(eventsFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            totalEvents: events.length,
            events: events
        }, null, 2));
        
        console.log(`\n💾 Events saved to: ${eventsFile}`);
        
        return events;
        
    } catch (error) {
        console.error('❌ Failed to get all Utah events:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    }
}

// Run the event discovery
getAllUtahEvents().then((events) => {
    console.log('✅ Utah event discovery completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});


